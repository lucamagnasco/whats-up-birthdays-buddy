
-- 1. Give the role explicit privilege
GRANT INSERT, SELECT, UPDATE ON public.groups TO authenticated;

-- 2. Let Postgres fill created_by automatically
ALTER TABLE public.groups
  ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 3. Tighten the policy to rely on the default, not client input
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
CREATE POLICY "Users can create groups"
ON public.groups FOR INSERT
WITH CHECK (created_by = auth.uid());

-- 4. (Nice to have) Ensure creators can see their own groups even
--    before they add themselves to group_members
DROP POLICY IF EXISTS "Users can view groups they're members of" ON public.groups;
CREATE POLICY "Users can view groups they own or belong to"
ON public.groups FOR SELECT
USING (
  created_by = auth.uid()
  OR id = ANY(public.get_user_group_ids(auth.uid()))
);
