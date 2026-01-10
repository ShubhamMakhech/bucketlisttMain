# OTP Authentication System Documentation

## Overview

This document describes the complete OTP (One-Time Password) authentication system implemented for the BucketListt application. The system provides a unified sign-up and sign-in flow that supports both email and phone number authentication via OTP, while maintaining backward compatibility with password-based authentication.

## Features

- ✅ **Unified Input**: Single input field accepts either email or phone number
- ✅ **Automatic Detection**: Automatically detects if input is email or phone number
- ✅ **Dual OTP Delivery**: 
  - Email OTP via Resend API
  - SMS OTP via MSG91 API
- ✅ **Simplified Sign-up**: No first name, last name, or password required during initial sign-up
- ✅ **Multiple Sign-in Methods**: 
  - OTP-based sign-in
  - Password-based sign-in (for existing users)
  - Google OAuth sign-in
- ✅ **Backward Compatibility**: Existing users can continue using password-based authentication
- ✅ **Auto Country Code**: Automatically adds country code `91` to phone numbers if missing
- ✅ **Session Management**: Automatic session creation after OTP verification
- ✅ **Email Update**: Direct email updates without verification requirement

## Architecture

### Authentication Flow

```
┌─────────────────┐
│  User Input     │ (Email or Phone)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Detect Type    │ (Email or Phone)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Send OTP       │ (Edge Function)
│  - Generate OTP │
│  - Store in DB  │
│  - Send via     │
│    Email/SMS    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Enters    │
│  OTP            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verify OTP    │ (Edge Function)
│  - Check expiry │
│  - Validate OTP │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sign Up/In    │ (Edge Function)
│  - Create User │
│  - Create Session│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Logged In│
└────────────────┘
```

## Edge Functions

### 1. `send-otp`

**Purpose**: Generates and sends OTP via email or SMS

**Endpoint**: `POST /functions/v1/send-otp`

**Request Body**:
```json
{
  "email": "user@example.com",  // Optional if phoneNumber provided
  "phoneNumber": "9876543210",   // Optional if email provided
  "type": "email" | "sms"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Features**:
- Generates 6-digit OTP
- Stores OTP in `otp_verifications` table with 10-minute expiry
- Sends email OTP via Resend API
- Sends SMS OTP via MSG91 Flow API
- Auto-adds country code `91` to phone numbers
- Validates email and phone number formats

**Environment Variables Required**:
- `RESEND_API_KEY`: Resend API key for email OTP
- `MSG91_AUTH_KEY`: MSG91 authentication key
- `MSG91_OTP_TEMPLATE_ID`: MSG91 template ID (with `{#var#}` placeholder)

---

### 2. `verify-otp`

**Purpose**: Verifies an OTP against the database

**Endpoint**: `POST /functions/v1/verify-otp`

**Request Body**:
```json
{
  "identifier": "user@example.com" | "919876543210",
  "otp": "123456",
  "type": "email" | "sms"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

**Features**:
- Validates OTP against stored value
- Checks expiration time (10 minutes)
- Marks OTP as verified
- Formats phone numbers before lookup

---

### 3. `signup-with-otp`

**Purpose**: Creates a new user account after OTP verification

**Endpoint**: `POST /functions/v1/signup-with-otp`

**Request Body**:
```json
{
  "identifier": "user@example.com" | "919876543210",
  "otp": "123456",
  "type": "email" | "sms",
  "role": "customer" | "vendor" | "agent"  // Optional, defaults to "customer"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Account created successfully",
  "sessionLink": "https://...",
  "token": "magic_link_token",
  "tokenHash": "token_hash_or_null",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  }
}
```

**Features**:
- Verifies OTP (checks both unverified and recently verified OTPs)
- Checks for existing users to prevent duplicates
- Creates profile in `profiles` table
- Creates auth user in `auth.users` with `email_confirm: true`
- Generates session link for automatic sign-in
- Returns session token for client-side session creation

**Important Notes**:
- For phone numbers, creates a placeholder email: `phone_<phone_number>@bucketlistt.local`
- OTP verification is handled within this function (no need for separate verify call)
- Handles retry scenarios by checking recently verified OTPs (within 2 minutes)

---

### 4. `signin-with-otp`

**Purpose**: Signs in an existing user after OTP verification

**Endpoint**: `POST /functions/v1/signin-with-otp`

**Request Body**:
```json
{
  "identifier": "user@example.com" | "919876543210",
  "otp": "123456",
  "type": "email" | "sms"
}
```

**Response**:
```json
{
  "success": true,
  "sessionLink": "https://...",
  "token": "magic_link_token",
  "tokenHash": "token_hash_or_null",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  }
}
```

**Features**:
- Verifies OTP
- Checks if user exists in `profiles` table
- If profile exists but no auth user, creates auth user automatically
- Handles phone number lookup with multiple format variations
- Generates session link for automatic sign-in
- Returns session token for client-side session creation

---

### 5. `check-user-exists`

**Purpose**: Checks if a user (email or phone) already exists in the profiles table

**Endpoint**: `POST /functions/v1/check-user-exists`

**Request Body**:
```json
{
  "email": "user@example.com"  // Optional if phoneNumber provided
}
```
OR
```json
{
  "phoneNumber": "9876543210"  // Optional if email provided
}
```

**Response**:
```json
{
  "userExists": true,
  "message": "User already registered"
}
```

**Features**:
- Checks `profiles` table only (not `auth.users`)
- Handles phone number lookup with multiple format variations
- Supports both `phoneNumber` and `phone_number` field names
- Used by frontend to determine if user should sign up or sign in

---

### 6. `update-user-email`

**Purpose**: Updates a user's email address directly without verification

**Endpoint**: `POST /functions/v1/update-user-email`

**Request Body**:
```json
{
  "userId": "user-uuid",
  "newEmail": "newemail@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email updated successfully"
}
```

**Features**:
- Validates email format
- Checks for duplicate emails
- Updates email in both `auth.users` and `profiles` tables
- Preserves email confirmation status
- Uses database function to bypass API limitations

**Database Function**: `update_user_email(p_user_id UUID, p_new_email TEXT)`

---

## Database Schema

### `otp_verifications` Table

Stores OTP codes for verification:

```sql
CREATE TABLE public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,              -- email or phone number
  otp TEXT NOT NULL,                     -- 6-digit OTP
  type TEXT NOT NULL CHECK (type IN ('email', 'sms')),
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,  -- 10 minutes from creation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Indexes**:
- `idx_otp_verifications_identifier_type`: On `(identifier, type)`
- `idx_otp_verifications_expires_at`: On `expires_at`

**RLS**: Enabled, but service role (used by Edge Functions) bypasses RLS

---

### `profiles` Table Modifications

**Changes Made**:
- `first_name` and `last_name` are now nullable (to support simplified sign-up)
- Email can be updated directly via `update-user-email` function

---

### Database Functions

#### `update_user_email(p_user_id UUID, p_new_email TEXT)`

Updates user email in both `auth.users` and `profiles` tables.

**Features**:
- Validates email format
- Checks for duplicate emails
- Preserves email confirmation status
- Updates `profiles.email` and `auth.users.email`
- Returns JSON response with success/error status

---

## Frontend Components

### 1. `SignUpFormOTP`

**Location**: `src/components/auth/SignUpFormOTP.tsx`

**Features**:
- Single input field for email or phone number
- Automatic type detection
- OTP sending and verification
- Form state reset on mount and after successful signup
- Role selection (customer, vendor, agent)

**State Management**:
- `identifier`: Email or phone number input
- `otp`: OTP code input
- `step`: "input" | "verify"
- `countdown`: Resend OTP countdown timer

---

### 2. `SignInFormOTP`

**Location**: `src/components/auth/SignInFormOTP.tsx`

**Features**:
- Tabs for OTP and Password sign-in methods
- Google OAuth sign-in button
- OTP-based sign-in flow
- Password-based sign-in (for existing users)
- Form state reset on mount and when user logs out
- Tab switching resets OTP state

**State Management**:
- `activeTab`: "otp" | "password"
- `otpIdentifier`: Email or phone number for OTP
- `otp`: OTP code input
- `otpStep`: "input" | "verify"
- `email`: Email for password sign-in
- `password`: Password for password sign-in

---

### 3. `EditProfileDialog`

**Location**: `src/components/EditProfileDialog.tsx`

**Features**:
- Email update functionality
- Calls `update-user-email` Edge Function
- Refreshes user session after email update
- Immediate UI update without logout/login

---

## AuthContext Methods

### `sendOTP(identifier: string, type: "email" | "sms", isSignIn?: boolean)`

Sends OTP to the provided email or phone number.

**Parameters**:
- `identifier`: Email or phone number
- `type`: "email" or "sms"
- `isSignIn`: Optional, if `true`, checks if user exists before sending OTP

**Returns**: `Promise<{ error: any; success?: boolean }>`

---

### `verifyOTP(identifier: string, otp: string, type: "email" | "sms")`

Verifies an OTP code.

**Parameters**:
- `identifier`: Email or phone number
- `otp`: 6-digit OTP code
- `type`: "email" or "sms"

**Returns**: `Promise<{ error: any; success?: boolean }>`

**Note**: This method is not used during sign-up, as OTP verification is handled in `signup-with-otp`.

---

### `signUpWithOTP(identifier: string, otp: string, role?: "customer" | "vendor" | "agent")`

Creates a new user account after OTP verification.

**Parameters**:
- `identifier`: Email or phone number
- `otp`: 6-digit OTP code
- `role`: Optional user role (defaults to "customer")

**Returns**: `Promise<{ error: any }>`

**Session Handling**:
- Extracts `token` and `tokenHash` from response
- Uses `supabase.auth.verifyOtp()` to create session
- Handles both `email+token` and `token_hash` verification methods

---

### `signInWithOTP(identifier: string, otp: string)`

Signs in an existing user after OTP verification.

**Parameters**:
- `identifier`: Email or phone number
- `otp`: 6-digit OTP code

**Returns**: `Promise<{ error: any }>`

**Session Handling**:
- Extracts `token` and `tokenHash` from response
- Uses `supabase.auth.verifyOtp()` to create session
- Handles both `email+token` and `token_hash` verification methods

---

## Configuration

### Environment Variables

#### Supabase Edge Functions

Set these in your Supabase project dashboard under **Settings > Edge Functions > Secrets**:

1. **RESEND_API_KEY**
   - Description: API key for Resend email service
   - Required for: Email OTP delivery
   - Get from: [Resend Dashboard](https://resend.com/api-keys)

2. **MSG91_AUTH_KEY**
   - Description: Authentication key for MSG91 SMS service
   - Required for: SMS OTP delivery
   - Get from: [MSG91 Dashboard](https://control.msg91.com/)

3. **MSG91_OTP_TEMPLATE_ID**
   - Description: MSG91 template ID for OTP SMS
   - Required for: SMS OTP delivery
   - Template must contain: `{#var#}` placeholder for OTP
   - Get from: [MSG91 Templates](https://control.msg91.com/templates)

4. **SUPABASE_URL**
   - Description: Your Supabase project URL
   - Auto-configured in Edge Functions

5. **SUPABASE_SERVICE_ROLE_KEY**
   - Description: Service role key for admin operations
   - Auto-configured in Edge Functions
   - **Warning**: Never expose this in client-side code

---

### MSG91 Template Setup

Your MSG91 template should follow this format:

```
Your OTP for BucketListt account verification is {#var#}. This OTP is valid for 10 minutes. Do not share this code with anyone. Regards, BucketListt Team
```

**Important**: The placeholder must be exactly `{#var#}` (case-sensitive).

---

## Usage Examples

### Sign Up Flow

```typescript
// 1. User enters email or phone number
const identifier = "user@example.com"; // or "9876543210"

// 2. Detect type
const type = identifier.includes("@") ? "email" : "sms";

// 3. Send OTP
const { error } = await sendOTP(identifier, type, false); // false = sign up

// 4. User enters OTP
const otp = "123456";

// 5. Sign up with OTP
const { error: signUpError } = await signUpWithOTP(identifier, otp, "customer");
```

### Sign In Flow

```typescript
// 1. User enters email or phone number
const identifier = "user@example.com"; // or "9876543210"

// 2. Detect type
const type = identifier.includes("@") ? "email" : "sms";

// 3. Send OTP (checks if user exists)
const { error } = await sendOTP(identifier, type, true); // true = sign in

// 4. User enters OTP
const otp = "123456";

// 5. Sign in with OTP
const { error: signInError } = await signInWithOTP(identifier, otp);
```

### Update Email

```typescript
// From EditProfileDialog component
const { data, error } = await supabase.functions.invoke("update-user-email", {
  body: {
    userId: user.id,
    newEmail: "newemail@example.com",
  },
});

if (data?.success) {
  // Refresh session to update UI
  await supabase.auth.getUser();
  await supabase.auth.refreshSession();
}
```

---

## Phone Number Formatting

The system automatically handles phone number formatting:

1. **Input**: User can enter phone number in any format:
   - `9876543210`
   - `+91 9876543210`
   - `91-9876543210`
   - `(91) 9876543210`

2. **Normalization**: All non-digit characters are removed

3. **Country Code**: If number doesn't start with `91`, it's automatically added:
   - Input: `9876543210` → Stored: `919876543210`
   - Input: `919876543210` → Stored: `919876543210`

4. **Lookup**: System checks multiple formats when querying:
   - Exact match: `919876543210`
   - Without country code: `9876543210`
   - With country code: `919876543210`

---

## Security Considerations

1. **OTP Expiry**: OTPs expire after 10 minutes
2. **Single Use**: OTPs are marked as verified after use
3. **Rate Limiting**: Consider implementing rate limiting for OTP requests
4. **Service Role Key**: Edge Functions use service role key (never exposed to client)
5. **RLS**: Row Level Security enabled on `otp_verifications` table
6. **Email Confirmation**: New users created with `email_confirm: true` to bypass email verification

---

## Troubleshooting

### OTP Not Received

**Email OTP**:
1. Check `RESEND_API_KEY` is set correctly
2. Verify email is not in spam folder
3. Check Resend dashboard for delivery status
4. Verify email format is correct

**SMS OTP**:
1. Check `MSG91_AUTH_KEY` and `MSG91_OTP_TEMPLATE_ID` are set correctly
2. Verify phone number format (should include country code)
3. Check MSG91 dashboard for delivery status
4. Verify template ID is correct and contains `{#var#}` placeholder

---

### OTP Missing from SMS

**Issue**: SMS received but OTP code is missing

**Solution**: Ensure MSG91 template uses `{#var#}` placeholder and request body uses:
```json
{
  "variables": {
    "var": "123456"
  }
}
```

---

### "Invalid or Expired OTP" Error

**Possible Causes**:
1. OTP expired (10-minute limit)
2. OTP already used
3. Phone number format mismatch (check if country code is consistent)

**Solution**: Request a new OTP

---

### CORS Errors

**Issue**: CORS error when calling Edge Functions

**Solution**: Ensure Edge Functions return proper CORS headers:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
```

And handle OPTIONS requests:
```typescript
if (req.method === "OPTIONS") {
  return new Response(null, { status: 200, headers: corsHeaders });
}
```

---

### User Not Found During Sign In

**Issue**: "No account found" error when trying to sign in

**Possible Causes**:
1. Phone number format mismatch in database
2. User doesn't exist in `profiles` table

**Solution**: 
- Check phone number format in database
- System checks multiple formats automatically
- Ensure `check-user-exists` Edge Function is used (bypasses RLS)

---

### Session Not Created After Sign Up/In

**Issue**: Edge Function returns success but user is not logged in

**Possible Causes**:
1. `token` or `tokenHash` not extracted correctly
2. `verifyOtp` call failed

**Solution**: 
- Check that `sessionLink` is returned from Edge Function
- Verify `supabase.auth.verifyOtp()` is called with correct parameters
- Check browser console for errors

---

### Email Update Fails

**Issue**: `unexpected_failure` error when updating email

**Solution**: 
- System uses database function `update_user_email` to bypass API limitations
- Ensure migration `20250202000001-create-update-user-email-function.sql` is applied
- Check for duplicate email addresses

---

## Migration Files

1. **`20250130000000-add-otp-verifications-table.sql`**
   - Creates `otp_verifications` table
   - Adds indexes for performance

2. **`20250130000001-update-profiles-allow-null-names.sql`**
   - Makes `first_name` and `last_name` nullable in `profiles` table

3. **`20250202000000-allow-service-role-profiles-access.sql`**
   - Adds RLS policy for service role to access `profiles` table

4. **`20250202000001-create-update-user-email-function.sql`**
   - Creates `update_user_email` database function

---

## Testing Checklist

- [ ] Sign up with email
- [ ] Sign up with phone number
- [ ] Sign in with email OTP
- [ ] Sign in with phone number OTP
- [ ] Sign in with password (existing users)
- [ ] Sign in with Google OAuth
- [ ] OTP expiry (wait 10+ minutes)
- [ ] Invalid OTP handling
- [ ] Resend OTP functionality
- [ ] Phone number formatting (with/without country code)
- [ ] Email update in profile
- [ ] Form state reset after logout
- [ ] Tab switching in sign-in form
- [ ] Duplicate user prevention during sign-up

---

## Future Enhancements

1. **Rate Limiting**: Implement rate limiting for OTP requests
2. **OTP Cleanup**: Automated cleanup of expired OTPs (cron job)
3. **SMS Provider Fallback**: Support for multiple SMS providers
4. **OTP Retry Limits**: Limit number of OTP attempts
5. **Account Recovery**: OTP-based password reset
6. **Two-Factor Authentication**: Optional 2FA for enhanced security

---

## Support

For issues or questions:
1. Check this documentation
2. Review Edge Function logs in Supabase dashboard
3. Check browser console for client-side errors
4. Verify environment variables are set correctly
5. Test with different email/phone number formats

---

## Changelog

### Version 1.0.0 (Current)
- Initial OTP authentication implementation
- Email and SMS OTP support
- Unified sign-up/sign-in flow
- Backward compatibility with password authentication
- Email update functionality
- Form state management improvements

---

**Last Updated**: February 2025

