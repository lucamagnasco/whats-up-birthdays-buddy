-- Fix remaining database functions with missing search_path settings

-- Fix trigger_birthday_message_processing function
CREATE OR REPLACE FUNCTION public.trigger_birthday_message_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only trigger if this is a new pending message
  IF NEW.status = 'pending' THEN
    -- Use a slight delay to ensure the transaction is committed
    PERFORM pg_sleep(1);
    
    -- Trigger the processing function
    PERFORM public.process_pending_birthday_messages();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix sync_existing_data_to_profiles function
CREATE OR REPLACE FUNCTION public.sync_existing_data_to_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  member_record RECORD;
BEGIN
  -- For each user with group memberships, create or update their profile
  FOR member_record IN
    SELECT DISTINCT 
      gm.user_id,
      gm.name as full_name,
      gm.birthday,
      gm.likes,
      gm.gift_wishes,
      gm.whatsapp_number
    FROM public.group_members gm
    WHERE gm.user_id IS NOT NULL
  LOOP
    -- Insert or update profile
    INSERT INTO public.profiles (
      user_id,
      full_name,
      birthday,
      likes,
      gift_wishes,
      whatsapp_number
    ) VALUES (
      member_record.user_id,
      member_record.full_name,
      member_record.birthday,
      member_record.likes,
      member_record.gift_wishes,
      member_record.whatsapp_number
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      birthday = EXCLUDED.birthday,
      likes = EXCLUDED.likes,
      gift_wishes = EXCLUDED.gift_wishes,
      whatsapp_number = EXCLUDED.whatsapp_number,
      updated_at = now();
  END LOOP;
END;
$function$;

-- Fix check_todays_birthdays function
CREATE OR REPLACE FUNCTION public.check_todays_birthdays()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  birthday_person RECORD;
  group_member RECORD;
  check_date DATE;
BEGIN
  -- Use CURRENT_DATE to check for TODAY's birthdays
  check_date := CURRENT_DATE;
  
  RAISE NOTICE 'Checking for birthdays on date: %', check_date;
  
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
      EXTRACT(MONTH FROM gm.birthday) = EXTRACT(MONTH FROM check_date)
      AND EXTRACT(DAY FROM gm.birthday) = EXTRACT(DAY FROM check_date)
  LOOP
    RAISE NOTICE 'Found birthday person: %', birthday_person.name;
    
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
          AND DATE(bm.created_at) = check_date
        )
    LOOP
      RAISE NOTICE 'Sending reminder to: %', group_member.name;
      
      -- Insert birthday reminder message
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
END;
$function$;

-- Fix process_pending_birthday_messages function
CREATE OR REPLACE FUNCTION public.process_pending_birthday_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix send_birthday_message function
CREATE OR REPLACE FUNCTION public.send_birthday_message(message_id uuid, recipient_number text, template_name text, language text, template_parameters jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix trigger_birthday_processing function
CREATE OR REPLACE FUNCTION public.trigger_birthday_processing()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix process_pending_messages function
CREATE OR REPLACE FUNCTION public.process_pending_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
      
      -- Check if the response indicates success
      IF function_response->>'success' = 'true' THEN
        -- Update message status to sent
        UPDATE public.birthday_messages 
        SET status = 'sent', 
            sent_at = now()
        WHERE id = message_record.id;
        
        RAISE NOTICE 'Successfully sent message ID: %', message_record.id;
      ELSE
        -- Update message status to failed
        UPDATE public.birthday_messages 
        SET status = 'failed', 
            error_message = function_response->>'error',
            sent_at = now()
        WHERE id = message_record.id;
        
        RAISE NOTICE 'Failed to send message ID: %, Error: %', message_record.id, function_response->>'error';
      END IF;
      
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
$function$;