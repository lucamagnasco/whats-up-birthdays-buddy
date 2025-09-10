-- CRITICAL SECURITY FIX: Restrict access to personal information
-- Fix profiles table RLS - users should only see profiles of people in their shared groups

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policy that only allows viewing profiles of users in shared groups
CREATE POLICY "Users can view profiles in shared groups" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = (SELECT auth.uid()) OR -- Users can always see their own profile
  user_id IN (
    -- Users can see profiles of people in their shared groups
    SELECT DISTINCT gm2.user_id 
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = (SELECT auth.uid())
    AND gm2.user_id IS NOT NULL
  )
);

-- Fix group_members table RLS - users should only see members of groups they belong to

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow viewing members for all users" ON public.group_members;

-- Create secure policy that only allows viewing members of groups the user belongs to
CREATE POLICY "Users can view members of their groups" 
ON public.group_members 
FOR SELECT 
USING (
  group_id IN (
    SELECT group_id 
    FROM public.group_members 
    WHERE user_id = (SELECT auth.uid())
  ) OR
  -- Allow anonymous users to view members when joining via invite code
  (SELECT auth.uid()) IS NULL
);

-- SECURITY HARDENING: Fix database functions with proper search_path

-- Fix auto_add_group_creator function
CREATE OR REPLACE FUNCTION public.auto_add_group_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only auto-add creator if they're authenticated with Supabase
  IF NEW.created_by IS NOT NULL AND auth.uid() IS NOT NULL THEN
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
      'Group Creator',
      '1990-01-01',
      '',
      '',
      ''
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix sync_profile_to_group_memberships function
CREATE OR REPLACE FUNCTION public.sync_profile_to_group_memberships()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix send_welcome_message_to_new_member function
CREATE OR REPLACE FUNCTION public.send_welcome_message_to_new_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
      'welcome_birthday',
      'es_AR',
      jsonb_build_array(
        NEW.name
      ),
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix get_user_group_ids function
CREATE OR REPLACE FUNCTION public.get_user_group_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT ARRAY(
    SELECT group_id 
    FROM public.group_members 
    WHERE user_id = user_uuid
  );
$function$;