# OTP-Based Authentication Setup Guide

## Overview
This document describes the new simplified OTP-based authentication system that replaces the traditional email/password signup form.

## Features
- **Email OTP**: Users can sign up/sign in using email with OTP sent via Resend
- **Phone OTP**: Users can sign up/sign in using phone number with OTP sent via MSG91 WhatsApp
- **No Password Required**: Users don't need to remember passwords
- **Unified Flow**: Same flow for both sign up and sign in
- **Auth Method Tracking**: System stores which method (email/phone) was used for authentication

## Database Changes

### Migration: `20250120000000-add-otp-auth.sql`

1. **Added `auth_method` column to `profiles` table**
   - Type: TEXT
   - Values: 'email', 'phone', 'google'
   - Tracks how the user authenticated

2. **Made `first_name` and `last_name` nullable**
   - OTP-based signups don't require these fields initially
   - Can be filled in later in profile

3. **Created `otp_verifications` table**
   - Stores temporary OTP codes
   - Auto-expires after 10 minutes
   - Tracks verification attempts (max 5)

## Edge Functions

### 1. `send-otp` Function
**Location:** `supabase/functions/send-otp/index.ts`

**Purpose:** Generates and sends OTP via email or WhatsApp

**Request:**
```json
{
  "identifier": "user@example.com" or "+919876543210",
  "authMethod": "email" or "phone"
}
```

**Process:**
1. Validates identifier format
2. Generates 6-digit OTP
3. Stores OTP in database (expires in 10 minutes)
4. Sends OTP via:
   - **Email**: Resend API (uses booking confirmation email template style)
   - **Phone**: MSG91 WhatsApp API

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email/phone"
}
```

### 2. `verify-otp` Function
**Location:** `supabase/functions/verify-otp/index.ts`

**Purpose:** Verifies OTP and creates/signs in user

**Request:**
```json
{
  "identifier": "user@example.com" or "+919876543210",
  "otp": "123456",
  "authMethod": "email" or "phone"
}
```

**Process:**
1. Validates OTP (checks expiry, attempts)
2. Marks OTP as verified
3. Checks if user exists:
   - **Existing user**: Generates magic link for sign-in
   - **New user**: Creates account, generates magic link
4. Returns magic link for automatic sign-in

**Response:**
```json
{
  "success": true,
  "isNewUser": false,
  "userId": "uuid",
  "magicLink": "https://...",
  "message": "OTP verified successfully"
}
```

## Frontend Components

### OTPAuthForm Component
**Location:** `src/components/auth/OTPAuthForm.tsx`

**Features:**
- Two-step flow: Input identifier → Verify OTP
- Toggle between email and phone
- Auto-formatting for phone numbers
- Resend OTP functionality
- Error handling and validation

**Usage:**
```tsx
<OTPAuthForm onToggleMode={() => setAuthMode('password')} />
```

## MSG91 WhatsApp Template Setup

**Important:** You need to create a WhatsApp template in MSG91 with the following details:

- **Template Name:** `otp_verification`
- **Namespace:** `ca756b77_f751_41b3_adb9_96ed99519854` (your existing namespace)
- **Language:** English
- **Template Type:** Text
- **Body:** Should include a variable for the OTP code (e.g., `{{1}}`)

**Example Template:**
```
Your bucketlistt OTP code is: {{1}}. This code is valid for 10 minutes. Do not share this code with anyone.
```

**Note:** Update the template name in `send-otp/index.ts` if you use a different name.

## Environment Variables Required

### For Email OTP:
- `RESEND_API_KEY` - Your Resend API key

### For WhatsApp OTP:
- `WHATSAPP_MSG91_AUTH_KEY` or `VITE_WHATSAPP_MSG91` - Your MSG91 auth key

### For Magic Links:
- `SITE_URL` - Your site URL (defaults to https://www.bucketlistt.com)

## User Flow

### Sign Up Flow (New User):
1. User enters email or phone number
2. Clicks "Send OTP"
3. Receives OTP via email/WhatsApp
4. Enters 6-digit OTP
5. System creates account automatically
6. User is signed in via magic link
7. Redirected to homepage

### Sign In Flow (Existing User):
1. User enters email or phone number
2. Clicks "Send OTP"
3. Receives OTP via email/WhatsApp
4. Enters 6-digit OTP
5. System verifies and signs in user
6. Redirected to homepage

## Security Features

1. **OTP Expiry**: OTPs expire after 10 minutes
2. **Attempt Limiting**: Maximum 5 verification attempts per OTP
3. **Auto-cleanup**: Expired OTPs are automatically cleaned up
4. **Email/Phone Validation**: Format validation before sending OTP
5. **Magic Links**: Secure passwordless sign-in after OTP verification

## Migration Notes

### For Existing Users:
- Existing users can still use password-based authentication
- OTP auth is optional (toggle available in Auth page)
- Users can switch between OTP and password auth

### For New Users:
- OTP auth is the default method
- No need to provide first name, last name, or password
- Profile can be completed later

## Testing Checklist

- [ ] Email OTP sending works
- [ ] WhatsApp OTP sending works (MSG91 template created)
- [ ] OTP verification works for new users
- [ ] OTP verification works for existing users
- [ ] Magic link sign-in works
- [ ] OTP expiry works (10 minutes)
- [ ] Attempt limiting works (max 5 attempts)
- [ ] Phone number formatting works correctly
- [ ] Email validation works
- [ ] Error handling works for invalid OTPs
- [ ] Resend OTP works

## Troubleshooting

### OTP Not Received
1. Check email spam folder
2. Verify MSG91 template is approved
3. Check MSG91 auth key is correct
4. Verify phone number format

### Magic Link Not Working
1. Check `SITE_URL` environment variable
2. Verify Supabase redirect URLs are configured
3. Check browser console for errors

### User Creation Fails
1. Check database migration is applied
2. Verify `profiles` table has `auth_method` column
3. Check Supabase logs for errors

## Future Enhancements

1. **Profile Completion**: Prompt users to complete profile after first sign-in
2. **OTP Rate Limiting**: Add rate limiting per identifier
3. **SMS Fallback**: Add SMS OTP as fallback for WhatsApp
4. **Remember Device**: Option to remember device for 30 days
5. **Biometric Auth**: Add fingerprint/face ID for mobile apps

