-- Fix RLS policy for group_members to allow both anonymous and authenticated users to join
-- This resolves the "new row violates row-level security" error when users try to re-join groups

-- Drop the existing anonymous-only policy
DROP POLICY IF EXISTS "Anonymous users can join groups via invite" ON public.group_members;

-- Create a new comprehensive policy that allows both anonymous and authenticated users to join
CREATE POLICY "Users can join groups via invite" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  -- Allow anonymous users (where user_id is null) to join groups
  (user_id IS NULL)
  OR
  -- Allow authenticated users to join groups
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  -- Additional security: validate that the group exists and is active
  AND EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.deactivated_at IS NULL
  )
);

-- Also update the existing policy to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can add themselves to groups" ON public.group_members;

-- Create a new policy that allows users to add themselves to groups
CREATE POLICY "Users can add themselves to groups" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  -- Allow users to add themselves (user_id matches auth.uid())
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- Allow anonymous users (user_id is null)
  (user_id IS NULL)
); 