-- Restore anonymous group creation functionality
-- This was accidentally broken by later migrations

-- 1. Allow created_by to be NULL for anonymous groups
ALTER TABLE public.groups ALTER COLUMN created_by DROP NOT NULL;

-- 2. Update INSERT policy to allow anonymous group creation
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
CREATE POLICY "Anyone can create groups"
ON public.groups FOR INSERT
WITH CHECK (
  -- Authenticated users: must match their ID
  (auth.uid() IS NOT NULL AND created_by = auth.uid())
  OR 
  -- Anonymous users: created_by must be null
  (auth.uid() IS NULL AND created_by IS NULL)
);

-- 3. Update SELECT policy to allow viewing anonymous groups
DROP POLICY IF EXISTS "Users can view groups they own or belong to" ON public.groups;
CREATE POLICY "Users can view groups they own, belong to, or are anonymous"
ON public.groups FOR SELECT
USING (
  -- Authenticated users can see their own groups
  created_by = auth.uid()
  -- Users can see groups they're members of
  OR id = ANY(public.get_user_group_ids(auth.uid()))
  -- Anyone can see anonymous groups
  OR created_by IS NULL
);

-- 4. Update UPDATE policy to allow anonymous group updates (for claiming ownership)
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.groups;
CREATE POLICY "Group creators can update their groups"
ON public.groups FOR UPDATE
USING (
  -- Authenticated users: must own the group
  (auth.uid() IS NOT NULL AND created_by = auth.uid())
  OR
  -- Anonymous groups: can be updated by anyone (for claiming ownership)
  created_by IS NULL
);

-- 5. Update the auto-add creator trigger to handle anonymous groups
DROP TRIGGER IF EXISTS auto_add_group_creator_trigger ON public.groups;
DROP FUNCTION IF EXISTS public.auto_add_group_creator();

CREATE OR REPLACE FUNCTION public.auto_add_group_creator()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-add creator if they're authenticated
  -- Anonymous groups don't get automatic members
  IF NEW.created_by IS NOT NULL THEN
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER auto_add_group_creator_trigger
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_group_creator(); 