-- Update check_upcoming_birthdays function to only check for tomorrow's birthdays
CREATE OR REPLACE FUNCTION public.check_upcoming_birthdays()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  birthday_record RECORD;
  buenos_aires_now TIMESTAMP WITH TIME ZONE;
  check_date DATE;
BEGIN
  -- Get current time in Buenos Aires (UTC-3)
  buenos_aires_now := (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires');
  
  -- Only process if it's 8 AM Buenos Aires time
  IF EXTRACT(HOUR FROM buenos_aires_now) = 8 THEN
    -- Check for birthdays tomorrow (in Buenos Aires timezone)
    check_date := (buenos_aires_now + INTERVAL '1 day')::DATE;
    
    FOR birthday_record IN
      SELECT 
        gm.id as member_id,
        gm.group_id,
        gm.name,
        gm.birthday,
        gm.whatsapp_number,
        g.name as group_name
      FROM public.group_members gm
      JOIN public.groups g ON gm.group_id = g.id
      WHERE 
        g.deactivated_at IS NULL
        AND EXTRACT(MONTH FROM gm.birthday) = EXTRACT(MONTH FROM check_date)
        AND EXTRACT(DAY FROM gm.birthday) = EXTRACT(DAY FROM check_date)
        AND gm.whatsapp_number IS NOT NULL
        -- Avoid duplicate messages for the same day
        AND NOT EXISTS (
          SELECT 1 FROM public.birthday_messages bm 
          WHERE bm.member_id = gm.id 
          AND bm.status IN ('sent', 'pending')
          AND DATE(bm.created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') = (buenos_aires_now::DATE)
        )
    LOOP
      -- Insert birthday message for tomorrow
      INSERT INTO public.birthday_messages (
        group_id,
        member_id,
        recipient_number,
        template_name,
        language,
        template_parameters,
        status
      ) VALUES (
        birthday_record.group_id,
        birthday_record.member_id,
        birthday_record.whatsapp_number,
        'birthday_alert_arg',
        'es_AR',
        jsonb_build_array(
          birthday_record.name,
          'mañana, ' || to_char(birthday_record.birthday, 'DD "de" Month'),
          COALESCE(birthday_record.group_name, 'tu grupo'),
          '¡Prepárate para celebrar!'
        ),
        'pending'
      );
    END LOOP;
  END IF;
END;
$$;