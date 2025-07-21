-- Create a function to automatically add group creator as first member
CREATE OR REPLACE FUNCTION public.auto_add_group_creator()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically add the group creator as the first member with minimal data
  -- This ensures every group always has at least one member
  INSERT INTO public.group_members (
    group_id,
    user_id,
    name,
    birthday,
    likes,
    gift_wishes,
    whatsapp_number
  ) VALUES (
    NEW.id,
    NEW.created_by,
    'Group Creator', -- Default name, can be updated later
    '1990-01-01',    -- Default birthday, can be updated later
    '',              -- Empty likes, can be updated later
    '',              -- Empty gift wishes, can be updated later
    ''               -- Empty WhatsApp, can be updated later
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-add creator when group is created
CREATE TRIGGER auto_add_group_creator_trigger
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_group_creator();