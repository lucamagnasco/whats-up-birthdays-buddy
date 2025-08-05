-- Fix RLS Performance Issues
-- This migration addresses Supabase performance advisor warnings:
-- 1. Auth RLS Initialization Plan - wrap auth.uid() in subqueries
-- 2. Multiple Permissive Policies - consolidate duplicate policies

-- ============================================================================
-- PROFILES TABLE - Fix auth.uid() performance issues
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create optimized policies with subqueries
CREATE POLICY "Users can create their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING ((select auth.uid()) = user_id);

-- ============================================================================
-- WHATSAPP_CONFIG TABLE - Fix auth.uid() performance issues
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own WhatsApp config" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Users can create their own WhatsApp config" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Users can update their own WhatsApp config" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Users can delete their own WhatsApp config" ON public.whatsapp_config;

-- Create optimized policies with subqueries
CREATE POLICY "Users can view their own WhatsApp config" 
ON public.whatsapp_config FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own WhatsApp config" 
ON public.whatsapp_config FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own WhatsApp config" 
ON public.whatsapp_config FOR UPDATE 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own WhatsApp config" 
ON public.whatsapp_config FOR DELETE 
USING ((select auth.uid()) = user_id);

-- ============================================================================
-- BIRTHDAY_MESSAGES TABLE - Fix auth.uid() performance issues
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in their groups" ON public.birthday_messages;
DROP POLICY IF EXISTS "Users can create messages in their groups" ON public.birthday_messages;

-- Create optimized policies with subqueries
CREATE POLICY "Users can view messages in their groups" 
ON public.birthday_messages FOR SELECT 
USING (
  group_id IN (
    SELECT group_id FROM public.group_members 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can create messages in their groups" 
ON public.birthday_messages FOR INSERT 
WITH CHECK (
  group_id IN (
    SELECT group_id FROM public.group_members 
    WHERE user_id = (select auth.uid())
  )
);

-- ============================================================================
-- MESSAGE_TEMPLATES TABLE - Fix auth.uid() performance issues
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own templates" ON public.message_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.message_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.message_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.message_templates;

-- Create optimized policies with subqueries
CREATE POLICY "Users can view their own templates" 
ON public.message_templates FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own templates" 
ON public.message_templates FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.message_templates FOR UPDATE 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.message_templates FOR DELETE 
USING ((select auth.uid()) = user_id);

-- ============================================================================
-- GROUP_MEMBERS TABLE - Fix auth.uid() performance issues and consolidate policies
-- ============================================================================

-- Drop all existing policies to consolidate them
DROP POLICY IF EXISTS "Users can view members in their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can add themselves to groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can update their own member info" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups via invite" ON public.group_members;
DROP POLICY IF EXISTS "Allow viewing members for all users" ON public.group_members;
DROP POLICY IF EXISTS "Allow updating member info for all users" ON public.group_members;
DROP POLICY IF EXISTS "Users and anonymous can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Allow adding members for all users" ON public.group_members;

-- Create consolidated and optimized policies
CREATE POLICY "Allow viewing members for all users" 
ON public.group_members FOR SELECT 
USING (true);

CREATE POLICY "Allow updating member info for all users" 
ON public.group_members FOR UPDATE 
USING (true);

-- Consolidated INSERT policy that handles both authenticated and anonymous users
CREATE POLICY "Users and anonymous can join groups" 
ON public.group_members FOR INSERT 
WITH CHECK (
  -- Allow anonymous users (where user_id is null)
  (user_id IS NULL)
  OR
  -- Allow authenticated users to join groups
  ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid()))
);

-- ============================================================================
-- GROUPS TABLE - Fix auth.uid() performance issues
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view groups they own, belong to, or are anonymous" ON public.groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.groups;
DROP POLICY IF EXISTS "Allow group creation for all users" ON public.groups;
DROP POLICY IF EXISTS "Allow viewing groups for all users" ON public.groups;
DROP POLICY IF EXISTS "Allow group updates for all creators" ON public.groups;

-- Create optimized policies with subqueries
CREATE POLICY "Allow group creation for all users" 
ON public.groups FOR INSERT 
WITH CHECK (
  -- Authenticated users: must match their ID
  ((select auth.uid()) IS NOT NULL AND created_by = (select auth.uid()))
  OR 
  -- Anonymous users: created_by must be null
  ((select auth.uid()) IS NULL AND created_by IS NULL)
);

CREATE POLICY "Allow viewing groups for all users" 
ON public.groups FOR SELECT 
USING (
  -- Authenticated users can see their own groups
  created_by = (select auth.uid())
  -- Users can see groups they're members of (only if authenticated)
  OR ((select auth.uid()) IS NOT NULL AND id = ANY(public.get_user_group_ids((select auth.uid()))))
  -- Anyone can see anonymous groups
  OR created_by IS NULL
);

CREATE POLICY "Allow group updates for all creators" 
ON public.groups FOR UPDATE 
USING (
  -- Authenticated users: must own the group
  ((select auth.uid()) IS NOT NULL AND created_by = (select auth.uid()))
  OR
  -- Anonymous groups: can be updated by anyone (for claiming ownership)
  created_by IS NULL
); 