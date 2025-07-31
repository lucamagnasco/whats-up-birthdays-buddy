-- Add birthday-related fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN birthday DATE,
ADD COLUMN likes TEXT,
ADD COLUMN gift_wishes TEXT;

-- Create function to sync profile data to group memberships
CREATE OR REPLACE FUNCTION public.sync_profile_to_group_memberships()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all group memberships for this user when profile changes
  UPDATE public.group_members 
  SET 
    name = COALESCE(NEW.full_name, OLD.full_name),
    birthday = COALESCE(NEW.birthday, OLD.birthday),
    likes = COALESCE(NEW.likes, OLD.likes),
    gift_wishes = COALESCE(NEW.gift_wishes, OLD.gift_wishes),
    whatsapp_number = COALESCE(NEW.whatsapp_number, OLD.whatsapp_number)
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync profile changes to group memberships
CREATE TRIGGER sync_profile_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_group_memberships();

-- Create function to sync existing group membership data to profiles
CREATE OR REPLACE FUNCTION public.sync_existing_data_to_profiles()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the sync function to populate profiles with existing data
SELECT public.sync_existing_data_to_profiles(); 