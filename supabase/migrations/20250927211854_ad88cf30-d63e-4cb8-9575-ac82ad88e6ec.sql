-- Fix infinite recursion in group_members RLS policies

-- Drop the problematic SELECT policy
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;

-- Create a new, simpler SELECT policy that doesn't cause recursion
-- Users can view all group members (since groups are social by nature)
-- but we'll restrict based on whether they have access to the group itself
CREATE POLICY "Users can view group members"
ON public.group_members
FOR SELECT
USING (
  -- Allow if user is anonymous (for public group viewing)
  auth.uid() IS NULL
  OR
  -- Allow if user is a member of this group (using function to avoid recursion)
  group_id = ANY(get_user_group_ids(auth.uid()))
  OR
  -- Allow if user created this group
  group_id IN (
    SELECT id FROM public.groups 
    WHERE created_by = auth.uid()
  )
);