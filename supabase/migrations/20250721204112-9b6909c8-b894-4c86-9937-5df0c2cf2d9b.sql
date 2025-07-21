-- Create function to process and send pending WhatsApp messages
CREATE OR REPLACE FUNCTION public.process_pending_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_record RECORD;
  function_response JSONB;
BEGIN
  -- Process all pending messages
  FOR message_record IN
    SELECT id, group_id, member_id, recipient_number, template_name, language, template_parameters
    FROM public.birthday_messages 
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 10 -- Process max 10 messages per run to avoid timeouts
  LOOP
    BEGIN
      -- Call the send-whatsapp-message function
      SELECT content::jsonb INTO function_response
      FROM http_post(
        'https://mxprusqbnjhbqstmrgkt.supabase.co/functions/v1/send-whatsapp-message',
        jsonb_build_object('messageId', message_record.id),
        'application/json',
        jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        )
      );
      
      -- Log successful processing attempt
      RAISE NOTICE 'Processed message ID: %, Response: %', message_record.id, function_response;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other messages
      RAISE NOTICE 'Failed to process message ID: %, Error: %', message_record.id, SQLERRM;
      
      -- Update message with error status
      UPDATE public.birthday_messages 
      SET status = 'failed', 
          error_message = SQLERRM,
          sent_at = now()
      WHERE id = message_record.id;
    END;
  END LOOP;
END;
$$;

-- Schedule the message processing function to run every 15 minutes
SELECT cron.schedule(
  'process-whatsapp-messages',
  '*/15 * * * *', -- Every 15 minutes
  'SELECT public.process_pending_messages();'
);