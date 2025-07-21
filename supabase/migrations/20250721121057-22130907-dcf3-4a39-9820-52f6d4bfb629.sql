-- Allow public access to active groups for invite functionality
-- This enables the join flow for users who are not yet members
CREATE POLICY "Anyone can view active groups for joining" 
ON public.groups 
FOR SELECT 
USING (deactivated_at IS NULL);