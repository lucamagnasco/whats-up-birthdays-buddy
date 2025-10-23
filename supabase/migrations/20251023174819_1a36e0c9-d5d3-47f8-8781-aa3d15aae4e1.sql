-- Fix birthday detection to use Argentina timezone (UTC-3)
-- This ensures birthdays are checked according to Argentina time, not UTC

CREATE OR REPLACE FUNCTION public.check_todays_birthdays()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  birthday_person RECORD;
  group_member RECORD;
  check_date DATE;
  argentina_now TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current time in Argentina timezone (UTC-3)
  argentina_now := NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires';
  check_date := DATE(argentina_now);
  
  RAISE NOTICE 'Checking for birthdays on Argentina date: % (UTC time: %)', check_date, CURRENT_DATE;
  
  -- Find all people with birthdays today (in Argentina timezone)
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
    RAISE NOTICE 'Found birthday person: % in group: %', birthday_person.name, birthday_person.group_name;
    
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
        -- Avoid duplicate messages for the same day (using Argentina timezone)
        AND NOT EXISTS (
          SELECT 1 FROM public.birthday_messages bm 
          WHERE bm.member_id = birthday_person.member_id 
          AND bm.recipient_number = gm.whatsapp_number
          AND bm.status IN ('sent', 'pending')
          AND DATE(bm.created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') = check_date
        )
    LOOP
      RAISE NOTICE 'Sending reminder to: % at %', group_member.name, group_member.whatsapp_number;
      
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
  
  RAISE NOTICE 'Birthday check completed for Argentina date: %', check_date;
END;
$$;