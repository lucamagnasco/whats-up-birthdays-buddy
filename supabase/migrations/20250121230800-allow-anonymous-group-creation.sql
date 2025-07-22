-- Allow anonymous group creation by making created_by nullable
ALTER TABLE public.groups ALTER COLUMN created_by DROP NOT NULL;

-- Update RLS policy to allow viewing groups with null created_by (anonymous groups)
-- and allow anonymous users to create groups
DROP POLICY IF EXISTS "Users can view groups they own or belong to" ON public.groups;
CREATE POLICY "Users can view groups they own, belong to, or are anonymous"
ON public.groups FOR SELECT
USING (
  created_by = auth.uid()
  OR id = ANY(public.get_user_group_ids(auth.uid()))
  OR created_by IS NULL  -- Allow viewing anonymous groups
);

-- Allow anonymous group creation
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

-- Allow group creators (including anonymous) to update their groups
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