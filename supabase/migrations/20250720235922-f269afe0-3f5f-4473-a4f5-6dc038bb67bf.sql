-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view members in their groups" ON public.group_members;

-- Create a security definer function to get user's group IDs without recursion
CREATE OR REPLACE FUNCTION public.get_user_group_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT ARRAY(
    SELECT group_id 
    FROM public.group_members 
    WHERE user_id = user_uuid
  );
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view members in their groups" 
ON public.group_members 
FOR SELECT 
USING (group_id = ANY(public.get_user_group_ids(auth.uid())));