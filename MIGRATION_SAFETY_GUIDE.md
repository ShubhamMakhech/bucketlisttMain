# Migration Safety Guide

## Overview
The migration `20250120000000-add-otp-auth.sql` is designed to be **idempotent** and **safe** to run multiple times without affecting existing data.

## Safety Features

### ✅ What This Migration Does (SAFE)
1. **Adds new column** (`auth_method`) - Does not modify existing data
2. **Makes columns nullable** (`first_name`, `last_name`) - Only changes constraints, preserves all existing data
3. **Creates new table** (`otp_verifications`) - Does not touch existing tables
4. **Creates indexes** - Improves performance, safe to run multiple times
5. **Updates functions** - Uses `CREATE OR REPLACE`, safe to run multiple times
6. **Creates policies** - Uses `DROP IF EXISTS` then `CREATE`, safe to recreate

### ❌ What This Migration Does NOT Do
- ❌ Does NOT drop any columns
- ❌ Does NOT delete any data
- ❌ Does NOT modify existing user data
- ❌ Does NOT change existing constraints on other columns
- ❌ Does NOT affect existing authentication flows

## Testing Locally

### Before Running Migration
1. **Backup your database** (recommended even for local testing)
   ```bash
   # Using Supabase CLI
   supabase db dump -f backup.sql
   ```

2. **Check current schema**
   ```sql
   -- Check if auth_method column exists
   SELECT column_name, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name = 'auth_method';
   
   -- Check if otp_verifications table exists
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'otp_verifications';
   ```

### Running Migration Locally
```bash
# Using Supabase CLI (local)
supabase migration up

# Or apply directly via SQL editor
# Copy and paste the migration SQL into Supabase SQL Editor
```

### Verifying Migration
```sql
-- Verify auth_method column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('auth_method', 'first_name', 'last_name');

-- Verify otp_verifications table was created
SELECT * FROM information_schema.tables 
WHERE table_name = 'otp_verifications';

-- Verify function was updated
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```

## Production Deployment

### Pre-Deployment Checklist
- [ ] Migration tested successfully in local/staging environment
- [ ] All edge functions (`send-otp`, `verify-otp`) are deployed
- [ ] Frontend components (`OTPAuthForm`) are deployed
- [ ] MSG91 WhatsApp template is created and approved
- [ ] Environment variables are set in production
- [ ] Database backup is taken

### Deployment Steps

1. **Backup Production Database**
   ```bash
   # Create a backup before migration
   supabase db dump --project-ref <your-project-ref> -f production-backup-$(date +%Y%m%d).sql
   ```

2. **Apply Migration to Production**
   ```bash
   # Using Supabase CLI
   supabase db push --project-ref <your-project-ref>
   
   # Or via Supabase Dashboard
   # Go to SQL Editor → New Query → Paste migration SQL → Run
   ```

3. **Verify Production Migration**
   ```sql
   -- Run the same verification queries as above
   ```

4. **Test OTP Flow in Production**
   - Test email OTP signup
   - Test phone OTP signup
   - Test existing user sign-in
   - Verify profile creation works

## Rollback Plan

If you need to rollback (unlikely, but good to have):

### Rollback SQL
```sql
-- Remove auth_method column (only if needed)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS auth_method;

-- Restore NOT NULL constraints (only if needed)
-- Note: This will fail if any NULL values exist
ALTER TABLE public.profiles 
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL;

-- Drop OTP table (only if needed)
DROP TABLE IF EXISTS public.otp_verifications CASCADE;

-- Restore original handle_new_user function
-- (You'll need to restore from your backup or previous migration)
```

## Idempotency

This migration is **idempotent**, meaning:
- ✅ Safe to run multiple times
- ✅ Won't create duplicate objects
- ✅ Won't modify existing data
- ✅ Can be run on both local and production safely

### How Idempotency is Achieved
- Uses `IF NOT EXISTS` for table creation
- Uses `CREATE OR REPLACE` for functions
- Uses `DROP IF EXISTS` then `CREATE` for policies
- Checks column existence before altering
- Uses `ON CONFLICT DO NOTHING` in function inserts

## Monitoring After Migration

### Check for Issues
```sql
-- Check for any profiles with NULL first_name/last_name (expected for OTP users)
SELECT COUNT(*) 
FROM profiles 
WHERE first_name IS NULL OR last_name IS NULL;

-- Check OTP table is working
SELECT COUNT(*) 
FROM otp_verifications 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check auth_method distribution
SELECT auth_method, COUNT(*) 
FROM profiles 
GROUP BY auth_method;
```

## Common Questions

### Q: Will this affect existing users?
**A:** No. Existing users' data remains unchanged. Only new OTP-based signups will have NULL first_name/last_name.

### Q: Can I run this on production immediately?
**A:** Yes, but it's recommended to test locally first. The migration is safe, but testing is always best practice.

### Q: What if the migration fails partway through?
**A:** The migration uses transactions, so it will either complete fully or rollback. Each statement is also idempotent, so you can re-run it.

### Q: Will this break existing authentication?
**A:** No. Existing password-based and Google OAuth flows continue to work. This only adds OTP as a new option.

## Support

If you encounter any issues:
1. Check Supabase logs for errors
2. Verify all environment variables are set
3. Check that edge functions are deployed
4. Review the migration SQL for any syntax errors

