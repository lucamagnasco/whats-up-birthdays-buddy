-- Create function to send welcome message to new group members
CREATE OR REPLACE FUNCTION public.send_welcome_message_to_new_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send welcome message if the new member has a WhatsApp number
  -- and this is not the group creator (who gets added automatically)
  IF NEW.whatsapp_number IS NOT NULL AND NEW.whatsapp_number != '' THEN
    -- Insert welcome message into birthday_messages table
    INSERT INTO public.birthday_messages (
      group_id,
      member_id,
      recipient_number,
      template_name,
      language,
      template_parameters,
      status
    ) VALUES (
      NEW.group_id,
      NEW.id,
      NEW.whatsapp_number,
      'group_welcome_arg',
      'es_AR',
      jsonb_build_array(
        NEW.name,
        (SELECT name FROM public.groups WHERE id = NEW.group_id)
      ),
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to send welcome message when new member joins
CREATE TRIGGER send_welcome_message_trigger
  AFTER INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_message_to_new_member();