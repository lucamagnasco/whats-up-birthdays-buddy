-- Fix WhatsApp template parameters and add better error handling
-- This migration updates the birthday alert function to use correct parameter structure

-- Update the birthday alert function to use correct 3-parameter structure
CREATE OR REPLACE FUNCTION public.check_upcoming_birthdays()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  birthday_person RECORD;
  group_member RECORD;
  buenos_aires_now TIMESTAMP WITH TIME ZONE;
  check_date DATE;
BEGIN
  -- Get current time in Buenos Aires (UTC-3)
  buenos_aires_now := (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires');
  
  -- Only process if it's 8 AM Buenos Aires time
  IF EXTRACT(HOUR FROM buenos_aires_now) = 8 THEN
    -- Check for birthdays TODAY (in Buenos Aires timezone)
    check_date := buenos_aires_now::DATE;
    
    -- Find all people with birthdays today
    FOR birthday_person IN
      SELECT 
        gm.id as member_id,
        gm.group_id,
        gm.name,
        gm.birthday,
        g.name as group_name
      FROM public.group_members gm
      JOIN public.groups g ON gm.group_id = g.id
      WHERE 
        g.deactivated_at IS NULL
        AND EXTRACT(MONTH FROM gm.birthday) = EXTRACT(MONTH FROM check_date)
        AND EXTRACT(DAY FROM gm.birthday) = EXTRACT(DAY FROM check_date)
    LOOP
      -- Send birthday reminder to all other group members (excluding the birthday person)
      FOR group_member IN
        SELECT 
          gm.id as member_id,
          gm.name,
          gm.whatsapp_number
        FROM public.group_members gm
        WHERE 
          gm.group_id = birthday_person.group_id
          AND gm.id != birthday_person.member_id  -- Exclude the birthday person
          AND gm.whatsapp_number IS NOT NULL
          AND gm.whatsapp_number != ''
          -- Avoid duplicate messages for the same day
          AND NOT EXISTS (
            SELECT 1 FROM public.birthday_messages bm 
            WHERE bm.member_id = birthday_person.member_id 
            AND bm.recipient_number = gm.whatsapp_number
            AND bm.status IN ('sent', 'pending')
            AND DATE(bm.created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') = check_date
          )
      LOOP
        -- Insert birthday reminder message with correct 3 parameters:
        -- {{1}} = Recipient name (who gets the reminder)
        -- {{2}} = Birthday person's name
        -- {{3}} = Birthday person's age
        INSERT INTO public.birthday_messages (
          group_id,
          member_id,
          recipient_number,
          template_name,
          language,
          template_parameters,
          status
        ) VALUES (
          birthday_person.group_id,
          birthday_person.member_id,
          group_member.whatsapp_number,
          'birthday_alert_arg',
          'es_AR',
          jsonb_build_array(
            group_member.name,  -- {{1}} = Recipient name (who gets the reminder)
            birthday_person.name,  -- {{2}} = Birthday person's name
            EXTRACT(YEAR FROM AGE(birthday_person.birthday))::text  -- {{3}} = Birthday person's age
          ),
          'pending'
        );
      END LOOP;
    END LOOP;
  END IF;
END;
$$;

-- Add index to improve performance of birthday message queries
CREATE INDEX IF NOT EXISTS idx_birthday_messages_status_created_at 
ON public.birthday_messages(status, created_at);

-- Add index to improve performance of duplicate message checks
CREATE INDEX IF NOT EXISTS idx_birthday_messages_member_recipient_status 
ON public.birthday_messages(member_id, recipient_number, status, created_at);

-- Update the message processing function to handle errors better
CREATE OR REPLACE FUNCTION public.process_pending_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_record RECORD;
  function_response JSONB;
  error_count INTEGER := 0;
  success_count INTEGER := 0;
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
      
      -- Check if the response indicates success
      IF function_response->>'success' = 'true' THEN
        success_count := success_count + 1;
        RAISE NOTICE 'Successfully processed message ID: %', message_record.id;
      ELSE
        error_count := error_count + 1;
        RAISE NOTICE 'Failed to process message ID: %, Error: %', message_record.id, function_response->>'error';
        
        -- Update message with error status
        UPDATE public.birthday_messages 
        SET status = 'failed', 
            error_message = function_response->>'error',
            sent_at = now()
        WHERE id = message_record.id;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      -- Log error but continue processing other messages
      RAISE NOTICE 'Exception processing message ID: %, Error: %', message_record.id, SQLERRM;
      
      -- Update message with error status
      UPDATE public.birthday_messages 
      SET status = 'failed', 
          error_message = SQLERRM,
          sent_at = now()
      WHERE id = message_record.id;
    END;
  END LOOP;
  
  -- Log summary
  RAISE NOTICE 'Message processing complete. Success: %, Errors: %', success_count, error_count;
END;
$$; 