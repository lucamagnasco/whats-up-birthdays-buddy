-- Add gift_wishes column to group_members table
-- This allows users to specify what gifts they would like for their birthday

ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS gift_wishes TEXT;

-- Add comment to document the new column
COMMENT ON COLUMN public.group_members.gift_wishes IS 'Birthday gift wishes or preferences for the group member'; 