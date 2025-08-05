# Fix Migration Timestamp Issues

The migration files have incorrect timestamps that don't follow the expected pattern. Here's how to fix them:

## Current Issue
Migration files like `20250125000000-*.sql` are being skipped because they don't match the expected timestamp pattern.

## Solution
Rename the migration files to follow the correct timestamp pattern: `YYYYMMDDHHMMSS_name.sql`

### Files to Rename:
1. `20250121230800-allow-anonymous-group-creation.sql` → `20250121230800_allow-anonymous-group-creation.sql`
2. `20250125000000-restore-anonymous-group-creation.sql` → `20250125000000_restore-anonymous-group-creation.sql`
3. `20250125000001-add-user-preferences-to-profiles.sql` → `20250125000001_add-user-preferences-to-profiles.sql`
4. `20250125000002-fix-whatsapp-template-parameters.sql` → `20250125000002_fix-whatsapp-template-parameters.sql`
5. `20250125000003-fix-template-names.sql` → `20250125000003_fix-template-names.sql`

### Commands to Run:
```bash
cd supabase/migrations
mv 20250121230800-allow-anonymous-group-creation.sql 20250121230800_allow-anonymous-group-creation.sql
mv 20250125000000-restore-anonymous-group-creation.sql 20250125000000_restore-anonymous-group-creation.sql
mv 20250125000001-add-user-preferences-to-profiles.sql 20250125000001_add-user-preferences-to-profiles.sql
mv 20250125000002-fix-whatsapp-template-parameters.sql 20250125000002_fix-whatsapp-template-parameters.sql
mv 20250125000003-fix-template-names.sql 20250125000003_fix-template-names.sql
```

## After Fixing
Run `npx supabase db reset` to apply all migrations properly.

## For Production Database
The production database likely already has the correct schema. The issue is that the birthday check function needs to be triggered manually or the cron job needs to be fixed.

### Manual Trigger in Production:
```sql
SELECT public.check_todays_birthdays();
```

### Check Cron Job Status:
```sql
SELECT * FROM cron.job WHERE command LIKE '%check_todays_birthdays%';
``` 