-- Add deactivated_at column for soft deletes
ALTER TABLE public.groups ADD COLUMN deactivated_at TIMESTAMP WITH TIME ZONE;

-- Update the RLS policy to exclude deactivated groups
DROP POLICY "Users can view groups they own or belong to" ON public.groups;

CREATE POLICY "Users can view active groups they own or belong to" 
ON public.groups 
FOR SELECT 
USING (
  deactivated_at IS NULL 
  AND ((created_by = auth.uid()) OR (id = ANY (get_user_group_ids(auth.uid()))))
);