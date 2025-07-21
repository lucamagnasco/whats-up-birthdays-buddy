-- Make sure created_by column is NOT NULL to enforce proper RLS
ALTER TABLE public.groups ALTER COLUMN created_by SET NOT NULL;