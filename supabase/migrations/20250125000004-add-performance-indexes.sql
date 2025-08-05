-- Add performance indexes for frequently queried columns
-- This will significantly improve query performance as the application scales

-- Index for groups table
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON public.groups(created_at);

-- Index for group_members table
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_birthday ON public.group_members(birthday);
CREATE INDEX IF NOT EXISTS idx_group_members_whatsapp_number ON public.group_members(whatsapp_number);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON public.group_members(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_birthday_month_day ON public.group_members(EXTRACT(MONTH FROM birthday), EXTRACT(DAY FROM birthday));

-- Index for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_number ON public.profiles(whatsapp_number);

-- Index for birthday_messages table
CREATE INDEX IF NOT EXISTS idx_birthday_messages_group_id ON public.birthday_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_birthday_messages_status ON public.birthday_messages(status);
CREATE INDEX IF NOT EXISTS idx_birthday_messages_sent_at ON public.birthday_messages(sent_at); 