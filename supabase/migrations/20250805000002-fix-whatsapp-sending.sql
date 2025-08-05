-- Fix WhatsApp sending by updating the processing function to work with Edge Functions
-- This replaces the placeholder send_birthday_message function with proper integration

-- Drop the old placeholder function
DROP FUNCTION IF EXISTS public.send_birthday_message(UUID, TEXT, TEXT, TEXT, JSONB);

-- Create a new function that properly integrates with the Edge Function
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
  -- Keep the message as 'pending' so the Edge Function can process it
  -- The Edge Function will handle the actual sending and status updates
  RAISE NOTICE 'Message % queued for processing via Edge Function for %', message_id, recipient_number;
END;
$$;

-- Update the processing function to work with the Edge Function approach
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
      -- Mark as queued for processing (keep as 'pending' for Edge Function)
      PERFORM public.send_birthday_message(
        message_record.id,
        message_record.recipient_number,
        message_record.template_name,
        message_record.language,
        message_record.template_parameters
      );
      
      processed_count := processed_count + 1;
      RAISE NOTICE 'Queued message % for processing via Edge Function for %', message_record.id, message_record.recipient_number;
      
    EXCEPTION WHEN OTHERS THEN
      -- Update message status to failed
      UPDATE public.birthday_messages
      SET 
        status = 'failed',
        error_message = SQLERRM
      WHERE id = message_record.id;
      
      RAISE NOTICE 'Failed to queue message %: %', message_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Queued % birthday messages for processing', processed_count;
END;
$$; 