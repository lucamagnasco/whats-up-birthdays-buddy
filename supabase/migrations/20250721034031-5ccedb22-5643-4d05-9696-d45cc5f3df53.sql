-- Fix the INSERT policy for groups table
DROP POLICY "Users can create groups" ON public.groups;

CREATE POLICY "Users can create groups" 
ON public.groups 
FOR INSERT 
TO authenticated
WITH CHECK (created_by = auth.uid());