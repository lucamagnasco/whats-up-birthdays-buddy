-- Add policy to allow anonymous users to join groups via invite links
CREATE POLICY "Anonymous users can join groups via invite" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  -- Allow anonymous users (where user_id is null) to join groups
  user_id IS NULL
  -- Additional security: we could add validation that the group exists and is active
  AND EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.deactivated_at IS NULL
  )
);