# OTP Authentication Implementation Summary

## Overview

This document summarizes the major changes made to implement OTP-based authentication for sign-up and sign-in processes.

## Changes Made

### 1. New Edge Functions

#### `supabase/functions/send-otp/index.ts`

- Sends OTP via email (using Resend) or SMS (using MSG91 API)
- Stores OTP in `otp_verifications` table with 5-minute expiration
- Validates email/phone number format

#### `supabase/functions/verify-otp/index.ts`

- Verifies OTP from database
- Checks expiration and marks OTP as verified
- Returns success/error status

#### `supabase/functions/signup-with-otp/index.ts`

- Handles complete OTP-based signup flow
- Verifies OTP, creates user account, generates session
- Auto-confirms email to skip email verification
- Handles both email and phone number signups

#### `supabase/functions/signin-with-otp/index.ts`

- Handles OTP-based sign-in
- Verifies OTP, finds user, generates session
- Supports both email and phone number sign-in

### 2. Database Migrations

#### `supabase/migrations/20250130000000-add-otp-verifications-table.sql`

- Creates `otp_verifications` table to store OTPs
- Fields: `id`, `identifier`, `otp`, `type`, `verified`, `verified_at`, `expires_at`, `created_at`
- Indexes for fast lookups

#### `supabase/migrations/20250130000001-update-profiles-allow-null-names.sql`

- Updates `profiles` table to allow NULL `first_name` and `last_name`
- Updates `handle_new_user()` trigger to handle null names
- Allows OTP signup without collecting names initially

### 3. Updated Components

#### `src/components/auth/SignUpFormOTP.tsx` (NEW)

- Single input field for email or phone number
- Auto-detects input type (email vs phone)
- Two-step flow: Send OTP → Verify OTP
- OTP countdown timer (60 seconds)
- Resend OTP functionality

#### `src/components/auth/SignInFormOTP.tsx` (NEW)

- Tabs for OTP and Password sign-in methods
- OTP tab: Send OTP → Verify OTP flow
- Password tab: Traditional email/password (for backward compatibility)
- Google sign-in button (unchanged)
- Maintains all existing functionality

#### `src/pages/Auth.tsx` (UPDATED)

- Uses `SignUpFormOTP` instead of `SignUpForm` for customer signup
- Uses `SignInFormOTP` instead of `SignInForm` for sign-in
- Vendor signup still uses `VendorSignUpForm` (unchanged)

### 4. Updated Context

#### `src/contexts/AuthContext.tsx`

- Added `sendOTP()` method
- Added `verifyOTP()` method
- Added `signUpWithOTP()` method
- Added `signInWithOTP()` method
- Existing `signIn()` and `signUp()` methods remain for backward compatibility

### 5. Updated Edge Functions

#### `supabase/functions/check-user-exists/index.ts` (UPDATED)

- Now accepts both `email` and `phoneNumber` parameters
- Checks profiles table for either email or phone number
- Returns user existence status

## Environment Variables Required

### For Email OTP (Already configured)

- `RESEND_API_KEY` - Resend API key for sending emails

### For SMS OTP (NEW - Need to configure)

- `MSG91_AUTH_KEY` - MSG91 authentication key
- `MSG91_OTP_TEMPLATE_ID` - MSG91 template ID for OTP SMS

**Note:** The MSG91 template should have one variable for the OTP code. The variable name can be `otp` or `##OTP##` (common MSG91 format).

## Features

### Sign-Up Flow

1. User enters email or phone number
2. System detects input type automatically
3. OTP is sent via email (Resend) or SMS (MSG91)
4. User enters 6-digit OTP
5. Account is created (no first_name/last_name required)
6. User is automatically signed in
7. Email confirmation is skipped (auto-confirmed)

### Sign-In Flow

1. **OTP Method:**

   - User enters email or phone number
   - OTP is sent
   - User verifies OTP
   - User is signed in

2. **Password Method (Backward Compatible):**

   - Existing users can still use email/password
   - No changes to existing functionality

3. **Google Sign-In:**
   - Unchanged, works as before

## Backward Compatibility

✅ **Fully Backward Compatible**

- Existing users can still sign in with email/password
- No breaking changes to existing authentication
- Old signup forms still work (VendorSignUpForm)
- All existing user data remains intact

## Database Changes

### New Table: `otp_verifications`

```sql
CREATE TABLE public.otp_verifications (
  id UUID PRIMARY KEY,
  identifier TEXT NOT NULL, -- email or phone
  otp TEXT NOT NULL,
  type TEXT NOT NULL, -- 'email' or 'sms'
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

### Updated Table: `profiles`

- `first_name` and `last_name` are now nullable
- Allows signup without collecting names initially

## Testing Checklist

- [ ] Email OTP signup works
- [ ] SMS OTP signup works
- [ ] Email OTP sign-in works
- [ ] SMS OTP sign-in works
- [ ] Password sign-in still works (backward compatibility)
- [ ] Google sign-in still works
- [ ] Existing users can sign in with password
- [ ] OTP expiration (5 minutes) works correctly
- [ ] Resend OTP works
- [ ] Invalid OTP shows error
- [ ] Duplicate signup shows appropriate error

## Next Steps

1. **Configure MSG91:**

   - Get MSG91 auth key
   - Create OTP template in MSG91 dashboard
   - Get template ID
   - Set environment variables in Supabase

2. **Test SMS OTP:**

   - Test with real phone numbers
   - Verify template variable format matches code
   - Adjust MSG91 API call if needed

3. **Optional Enhancements:**
   - Add rate limiting for OTP requests
   - Add phone number validation for specific countries
   - Add UI for collecting first_name/last_name after signup
   - Add profile completion flow

## Notes

- Email confirmation is disabled for OTP signups (auto-confirmed)
- Phone number signups create a temporary email (`{phone}@bucketlistt.temp`)
- Users can complete their profile later (first_name, last_name)
- OTP expires after 5 minutes
- OTP can only be used once (marked as verified)

## Files Modified/Created

### Created:

- `supabase/functions/send-otp/index.ts`
- `supabase/functions/verify-otp/index.ts`
- `supabase/functions/signup-with-otp/index.ts`
- `supabase/functions/signin-with-otp/index.ts`
- `supabase/migrations/20250130000000-add-otp-verifications-table.sql`
- `supabase/migrations/20250130000001-update-profiles-allow-null-names.sql`
- `src/components/auth/SignUpFormOTP.tsx`
- `src/components/auth/SignInFormOTP.tsx`

### Modified:

- `src/contexts/AuthContext.tsx`
- `src/pages/Auth.tsx`
- `supabase/functions/check-user-exists/index.ts`

### Unchanged (Backward Compatible):

- `src/components/auth/SignUpForm.tsx` (still exists, not used by default)
- `src/components/auth/SignInForm.tsx` (still exists, not used by default)
- `src/components/auth/VendorSignUpForm.tsx` (unchanged)
- All other authentication-related files

---

**Implementation Date:** Current
**Status:** ✅ Complete - Ready for testing and MSG91 configuration
