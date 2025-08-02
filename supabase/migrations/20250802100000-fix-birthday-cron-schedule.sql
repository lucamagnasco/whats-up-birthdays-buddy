-- Fix the birthday reminder system to work properly
-- The issue was that the function only processed at 8 AM but cron ran at 9 AM

-- First, unschedule the existing cron job
SELECT cron.unschedule('birthday-reminder-check');

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS public.check_upcoming_birthdays();

-- Create a new function with a clear name that checks for TODAY's birthdays
CREATE OR REPLACE FUNCTION public.check_todays_birthdays()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
      g.deactivated_at IS NULL
      AND EXTRACT(MONTH FROM gm.birthday) = EXTRACT(MONTH FROM check_date)
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
$$;

-- Schedule the birthday check to run daily at 9 AM Buenos Aires time (12 PM UTC)
SELECT cron.schedule(
  'birthday-reminder-check',
  '0 12 * * *', -- 12 PM UTC = 9 AM Buenos Aires (UTC-3)
  'SELECT public.check_todays_birthdays();'
); 