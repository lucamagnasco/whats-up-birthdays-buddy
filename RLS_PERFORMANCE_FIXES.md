# RLS Performance Fixes

This document outlines the fixes applied to resolve Supabase performance advisor warnings related to Row Level Security (RLS) policies.

## Issues Addressed

### 1. Auth RLS Initialization Plan Warnings

**Problem**: RLS policies were using `auth.uid()` directly, which causes the function to be re-evaluated for each row, leading to suboptimal query performance at scale.

**Solution**: Wrapped all `auth.uid()` calls in subqueries using `(select auth.uid())` to ensure the function is evaluated once per query rather than once per row.

**Tables Fixed**:
- `public.profiles`
- `public.whatsapp_config`
- `public.birthday_messages`
- `public.message_templates`
- `public.group_members`
- `public.groups`

### 2. Multiple Permissive Policies Warnings

**Problem**: Multiple permissive policies existed for the same role and action (e.g., INSERT) on the `public.group_members` table, causing performance degradation as each policy must be executed for every relevant query.

**Solution**: Consolidated duplicate policies into single, comprehensive policies that handle all the required functionality.

**Tables Fixed**:
- `public.group_members` - Consolidated multiple INSERT policies into one

## Migration Details

The fixes were implemented in migration `20250125000005-fix-rls-performance-issues.sql` which:

1. **Drops existing policies** that use `auth.uid()` directly
2. **Creates optimized policies** using `(select auth.uid())` subqueries
3. **Consolidates duplicate policies** to eliminate multiple permissive policies
4. **Maintains security** while improving performance

## Performance Impact

These changes should result in:

- **Faster query execution** for tables with RLS policies
- **Reduced CPU usage** during policy evaluation
- **Better scalability** as the application grows
- **Elimination of performance warnings** in Supabase advisor

## Security Considerations

All security requirements have been maintained:

- Users can only access their own data
- Anonymous users can still join groups
- Group membership restrictions are preserved
- All existing functionality remains intact

## Testing Recommendations

After applying these fixes, test the following scenarios:

1. **Authenticated user operations**:
   - Creating/updating profiles
   - Managing WhatsApp config
   - Creating/viewing birthday messages
   - Managing message templates
   - Joining/leaving groups
   - Creating/updating groups

2. **Anonymous user operations**:
   - Joining groups via invite codes
   - Viewing public group information

3. **Performance testing**:
   - Run queries on tables with RLS policies
   - Monitor query execution times
   - Verify no performance degradation

## Rollback Plan

If issues arise, the migration can be rolled back by:

1. Reverting the migration: `supabase db reset`
2. Or manually dropping and recreating the original policies

## Related Documentation

- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter) 