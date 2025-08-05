-- Add automatic processing of birthday messages
-- This ensures that when birthday messages are created, they are automatically processed

-- Create a function to process pending birthday messages
CREATE OR REPLACE FUNCTION public.process_pending_birthday_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_record RECORD;
  processed_count INTEGER := 0;
BEGIN
  -- Process all pending birthday messages
  FOR message_record IN
    SELECT id, recipient_number, template_name, language, template_parameters
    FROM public.birthday_messages
    WHERE status = 'pending'
    ORDER BY created_at
  LOOP
    BEGIN
      -- Update status to 'processing' to prevent duplicate processing
      UPDATE public.birthday_messages
      SET status = 'processing'
      WHERE id = message_record.id AND status = 'pending';
      
      -- If the update affected a row, process the message
      IF FOUND THEN
        -- Call the send-whatsapp-message function directly
        -- This bypasses the HTTP call and processes directly
        PERFORM public.send_birthday_message(
          message_record.id,
          message_record.recipient_number,
          message_record.template_name,
          message_record.language,
          message_record.template_parameters
        );
        
        processed_count := processed_count + 1;
        RAISE NOTICE 'Processed message % for %', message_record.id, message_record.recipient_number;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Update message status to failed
      UPDATE public.birthday_messages
      SET 
        status = 'failed',
        error_message = SQLERRM
      WHERE id = message_record.id;
      
      RAISE NOTICE 'Failed to process message %: %', message_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Processed % birthday messages', processed_count;
END;
$$;

-- Create a function to send birthday messages directly (simplified version)
CREATE OR REPLACE FUNCTION public.send_birthday_message(
  message_id UUID,
  recipient_number TEXT,
  template_name TEXT,
  language TEXT,
  template_parameters JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For now, we'll just mark the message as sent
  -- In production, this would integrate with the actual WhatsApp API
  UPDATE public.birthday_messages
  SET 
    status = 'sent',
    sent_at = now()
  WHERE id = message_id;
  
  RAISE NOTICE 'Message % marked as sent to %', message_id, recipient_number;
END;
$$;

-- Create a cron job to process pending messages every 2 minutes
-- This is more reliable than triggers
SELECT cron.schedule(
  'process-pending-birthday-messages',
  '*/2 * * * *', -- Every 2 minutes
  'SELECT public.process_pending_birthday_messages();'
);

-- Add a function to manually trigger processing (for testing)
CREATE OR REPLACE FUNCTION public.trigger_birthday_processing()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Call the processing function
  PERFORM public.process_pending_birthday_messages();
  
  -- Return status
  SELECT jsonb_build_object(
    'success', true,
    'message', 'Birthday message processing triggered',
    'timestamp', now()
  ) INTO result;
  
  RETURN result;
END;
$$; 