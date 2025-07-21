-- Create whatsapp_config table to store Kapso API credentials and settings
CREATE TABLE public.whatsapp_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  api_key TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create birthday_messages table to track sent messages and delivery status
CREATE TABLE public.birthday_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.group_members(id) ON DELETE CASCADE NOT NULL,
  recipient_number TEXT NOT NULL,
  template_name TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  template_parameters JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message_templates table for pre-approved WhatsApp templates
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  template_name TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  template_parameters JSONB DEFAULT '[]',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birthday_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_config
CREATE POLICY "Users can view their own WhatsApp config" 
ON public.whatsapp_config FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp config" 
ON public.whatsapp_config FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp config" 
ON public.whatsapp_config FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp config" 
ON public.whatsapp_config FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for birthday_messages
CREATE POLICY "Users can view messages in their groups" 
ON public.birthday_messages FOR SELECT 
USING (
  group_id IN (
    SELECT group_id FROM public.group_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their groups" 
ON public.birthday_messages FOR INSERT 
WITH CHECK (
  group_id IN (
    SELECT group_id FROM public.group_members 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for message_templates
CREATE POLICY "Users can view their own templates" 
ON public.message_templates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
ON public.message_templates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.message_templates FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.message_templates FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for timestamp updates
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to check for upcoming birthdays
CREATE OR REPLACE FUNCTION public.check_upcoming_birthdays()
RETURNS void AS $$
DECLARE
  birthday_record RECORD;
BEGIN
  -- Get all birthdays that are today or tomorrow
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
      EXTRACT(MONTH FROM gm.birthday) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '1 day')
      AND EXTRACT(DAY FROM gm.birthday) = EXTRACT(DAY FROM CURRENT_DATE + INTERVAL '1 day')
      AND gm.whatsapp_number IS NOT NULL
  LOOP
    -- Insert reminder record with template structure for Kapso API
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
        to_char(birthday_record.birthday, 'DD "de" Month'),
        COALESCE(birthday_record.likes, 'cosas especiales'),
        'un regalo sorpresa'
      ),
      'pending'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the birthday check to run daily at 9 AM
SELECT cron.schedule(
  'birthday-reminder-check',
  '0 9 * * *',
  'SELECT public.check_upcoming_birthdays();'
);

-- Insert default birthday template
INSERT INTO public.message_templates (
  user_id,
  name,
  template_name,
  language,
  template_parameters,
  description
) SELECT 
  auth.uid(),
  'Birthday Alert Argentina',
  'birthday_alert_arg',
  'es_AR',
  jsonb_build_array('name', 'birthday_date', 'likes', 'gift_suggestion'),
  'Template for birthday alerts in Argentina'
WHERE auth.uid() IS NOT NULL;