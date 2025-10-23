-- Security hardening: Remove anonymous access to personal data in group_members
-- This protects WhatsApp numbers, names, and other personal information

-- Drop the current policy that allows anonymous access
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;

-- Create a secure policy that only allows authenticated group members to view data
CREATE POLICY "Authenticated users can view their group members"
ON public.group_members
FOR SELECT
USING (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND (
    -- User is a member of this group (using security definer function to avoid recursion)
    group_id = ANY(get_user_group_ids(auth.uid()))
    OR
    -- User created this group
    group_id IN (
      SELECT id FROM public.groups 
      WHERE created_by = auth.uid()
    )
  )
);

-- Also restrict the UPDATE policy to only allow users to update their own member record
DROP POLICY IF EXISTS "Allow updating member info for all users" ON public.group_members;

CREATE POLICY "Users can update their own member info"
ON public.group_members
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    -- User can update their own member record
    user_id = auth.uid()
    OR
    -- Group creator can update any member in their group
    group_id IN (
      SELECT id FROM public.groups 
      WHERE created_by = auth.uid()
    )
  )
);

-- Ensure the INSERT policy is secure (already exists but let's verify it's correct)
DROP POLICY IF EXISTS "Users and anonymous can join groups" ON public.group_members;

CREATE POLICY "Authenticated users can join groups"
ON public.group_members
FOR INSERT
WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- User can only insert records for themselves
  user_id = auth.uid()
);