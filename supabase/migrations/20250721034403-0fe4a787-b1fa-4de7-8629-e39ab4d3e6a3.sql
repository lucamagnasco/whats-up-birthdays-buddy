-- Fix the SELECT policy to allow owners to see their deactivated groups
DROP POLICY "Users can view active groups they own or belong to" ON public.groups;

CREATE POLICY "Users can view groups they own or belong to" 
ON public.groups 
FOR SELECT 
TO authenticated
USING (
  (created_by = auth.uid()) OR 
  (deactivated_at IS NULL AND id = ANY (get_user_group_ids(auth.uid())))
);