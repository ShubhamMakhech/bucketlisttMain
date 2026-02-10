# Authentication System Analysis

## Overview

This document provides a comprehensive analysis of the current sign-up and sign-in processes for all user types in the bucketlistt application.

---

## User Types

### Current User Roles

The system supports the following user roles:

1. **Customer** (default)

   - Regular users who book experiences
   - Default role if no role is specified

2. **Vendor**

   - Experience providers who create and manage experiences
   - Can create offline bookings

3. **Agent**

   - Travel agents who can book on behalf of customers
   - Have access to B2B pricing
   - Can create offline bookings
   - **⚠️ ISSUE**: Agent role exists in code but NOT in database enum

4. **Admin**
   - System administrators
   - Can view all bookings and manage users

### ⚠️ Critical Issue: Agent Role Mismatch

- **Database Enum**: Only contains `('admin', 'customer', 'vendor')`
- **Code Usage**: References `'agent'` role extensively throughout the application
- **Impact**: When users try to sign up as "agent", the database trigger defaults them to "customer" role
- **Location**: `supabase/migrations/20250614105049-a70d69ec-c392-4ec2-b777-89d4d94c1115.sql` line 22

---

## Sign-Up Process

### 1. Customer Sign-Up (`SignUpForm.tsx`)

**Flow:**

1. User fills form with:

   - First Name, Last Name
   - Email
   - Phone Number (optional)
   - Password + Confirm Password
   - Terms & Conditions acceptance
   - Role: Fixed to "customer" (hardcoded)

2. **Validation:**

   - Password match check
   - Terms acceptance check
   - Email uniqueness check (via Edge Function)

3. **Backend Process:**

   - Calls `check-user-exists` Edge Function to verify email doesn't exist
   - Creates Supabase auth user with metadata:
     - `first_name`, `last_name`, `phone_number`, `role: "customer"`, `terms_accepted`
   - Database trigger `handle_new_user()` creates:
     - Profile in `profiles` table
     - Role entry in `user_roles` table (defaults to 'customer' if invalid)

4. **Post-Signup:**
   - Redirects to `/email-confirmation` page
   - User must confirm email before full access

**Files:**

- `src/components/auth/SignUpForm.tsx`
- `src/contexts/AuthContext.tsx` (signUp function)
- `supabase/functions/check-user-exists/index.ts`

---

### 2. Vendor/Agent Sign-Up (`VendorSignUpForm.tsx`)

**Flow:**

1. User fills form with:

   - Account Type selection (Vendor OR Agent) - Radio buttons
   - First Name, Last Name
   - **Company Name** (required, unique to vendor/agent signup)
   - Email
   - Phone Number (optional)
   - Password + Confirm Password
   - Terms & Conditions acceptance

2. **Validation:**

   - Password match check
   - Terms acceptance check
   - Email uniqueness check (via Edge Function)

3. **Backend Process:**

   - Same as customer signup
   - Role can be "vendor" OR "agent"
   - **⚠️ ISSUE**: If "agent" is selected, database will reject it and default to "customer"

4. **Post-Signup:**
   - Redirects to `/email-confirmation` page
   - Success message shows "Vendor" or "Agent" based on selection

**Files:**

- `src/components/auth/VendorSignUpForm.tsx`
- `src/contexts/AuthContext.tsx` (signUp function)

**Access:**

- Accessed via `/auth?mode=vendor` URL parameter
- Automatically sets signup mode when vendor mode detected

---

### 3. Sign-Up Backend Logic (`AuthContext.tsx`)

**Key Steps:**

1. **Email Validation** (Edge Function):

   ```typescript
   supabase.functions.invoke("check-user-exists", {
     body: { email: data.email.trim() },
   });
   ```

   - Checks `profiles` table for existing email
   - Returns `userExists: boolean`

2. **Supabase Auth Signup**:

   ```typescript
   supabase.auth.signUp({
     email: data.email,
     password: data.password,
     options: {
       emailRedirectTo: "https://www.bucketlistt.com/auth",
       data: {
         first_name,
         last_name,
         phone_number,
         role,
         terms_accepted,
       },
     },
   });
   ```

3. **Database Trigger** (`handle_new_user()`):
   - Automatically creates profile in `profiles` table
   - Creates role entry in `user_roles` table
   - **⚠️ Only accepts**: 'admin', 'customer', 'vendor'
   - **Defaults to**: 'customer' if role is invalid

**Edge Function:** `supabase/functions/check-user-exists/index.ts`

- Checks `profiles` table for email existence
- Uses service role key for access

---

## Sign-In Process

### 1. Sign-In Form (`SignInForm.tsx`)

**Flow:**

1. User enters:

   - Email
   - Password

2. **Authentication Methods:**

   - **Email/Password**: Standard Supabase auth
   - **Google OAuth**: Available (implemented)
   - **Apple Sign-In**: UI exists but not implemented

3. **Backend Process:**

   ```typescript
   supabase.auth.signInWithPassword({ email, password });
   ```

4. **Post-SignIn:**
   - Auth state listener updates user session
   - `useUserRole` hook fetches user role from `user_roles` table
   - Navigation based on role:
     - **Vendor**: `/profile`
     - **Customer/Agent**: `/` (home)

**Files:**

- `src/components/auth/SignInForm.tsx`
- `src/contexts/AuthContext.tsx` (signIn function)
- `src/pages/Auth.tsx` (navigation logic)

---

### 2. Google OAuth Sign-In

**Implementation:**

- Uses Supabase OAuth provider
- Redirects back to current page after authentication
- Stores current path in localStorage for post-login redirect

**Code:**

```typescript
supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: currentUrl },
});
```

**Location:** `src/components/auth/SignInForm.tsx` line 60-71

---

### 3. Role Detection (`useUserRole.tsx`)

**Process:**

1. Fetches role from `user_roles` table after authentication
2. Returns helper flags:
   - `isVendor`, `isAgent`, `isAdmin`, `isCustomer`
   - `isVendorOrAgent` (combined check)

**Query:**

```typescript
supabase.from("user_roles").select("role").eq("user_id", user.id).single();
```

**Default:** Falls back to "customer" if no role found

---

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SIGN-UP FLOW                              │
└─────────────────────────────────────────────────────────────┘

Customer Sign-Up:
  Form → Validate → check-user-exists Edge Function
  → Supabase Auth SignUp → Database Trigger
  → Create Profile + Role → Email Confirmation → Done

Vendor/Agent Sign-Up:
  Form (with role selection) → Validate → check-user-exists
  → Supabase Auth SignUp → Database Trigger
  → ⚠️ Agent role rejected → Defaults to Customer
  → Create Profile + Role → Email Confirmation → Done

┌─────────────────────────────────────────────────────────────┐
│                    SIGN-IN FLOW                              │
└─────────────────────────────────────────────────────────────┘

Email/Password:
  Form → Supabase Auth SignIn → Auth State Listener
  → Fetch User Role → Navigate Based on Role

Google OAuth:
  Button Click → OAuth Redirect → Callback
  → Auth State Listener → Fetch User Role → Navigate
```

---

## Database Schema

### Tables

1. **`profiles`** table:

   - `id` (UUID, FK to auth.users)
   - `email`, `first_name`, `last_name`, `phone_number`
   - `profile_picture_url`, `terms_accepted`
   - `created_at`, `updated_at`

2. **`user_roles`** table:
   - `id` (UUID, primary key)
   - `user_id` (UUID, FK to auth.users)
   - `role` (app_role enum: 'admin', 'customer', 'vendor')
   - `created_at`
   - **UNIQUE constraint**: (user_id, role)

### Database Trigger

**`handle_new_user()`** trigger:

- Fires AFTER INSERT on `auth.users`
- Creates profile entry
- Creates role entry
- **⚠️ Only accepts**: 'admin', 'customer', 'vendor' in CASE statement
- **Defaults to**: 'customer' for any other value

**Location:** Multiple migration files, latest in:

- `supabase/migrations/20250728170946-6431cc1a-4518-40d8-b745-56d168a56f71.sql`

---

## Security Features

### Row Level Security (RLS)

1. **Profiles Table:**

   - Users can view own profile
   - Users can update own profile
   - Users can insert own profile during signup

2. **User Roles Table:**
   - Users can view own roles
   - Users can insert own role during signup
   - **Users CANNOT modify or delete their roles** (security policy)

### Edge Function Security

- `check-user-exists`: Uses service role key
- Validates email before signup to prevent duplicates

---

## Issues & Inconsistencies

### 🔴 Critical Issues

1. **Agent Role Not in Database Enum**

   - Code references "agent" role extensively
   - Database enum only has: 'admin', 'customer', 'vendor'
   - Impact: Agent signups default to customer role
   - Files affected: Multiple components use `isAgent` checks

2. **Company Name Not Stored**

   - VendorSignUpForm collects `companyName`
   - But it's NOT passed to signUp function
   - Not stored in database

3. **Role Validation Mismatch**
   - `AuthContext.tsx` accepts "agent" in SignUpData interface
   - Database trigger rejects "agent" and defaults to "customer"
   - No error shown to user

### ⚠️ Potential Issues

1. **Email Confirmation Required?**

   - Code redirects to `/email-confirmation` but unclear if email confirmation is enforced
   - Users might be able to use app without confirming email

2. **Google OAuth Role Assignment**

   - No clear mechanism for assigning role during OAuth signup
   - OAuth users might default to customer only

3. **Password Reset Flow**
   - Reset password form exists but flow not fully analyzed
   - Uses `mode=reset` URL parameter

---

## Navigation After Authentication

### Post-SignIn Navigation (`Auth.tsx`)

```typescript
if (user && !loading && !roleLoading && !isResetMode) {
  if (isVendor) {
    navigate("/profile"); // Vendors go to profile
  } else {
    navigate("/"); // Customers/Agents go to home
  }
}
```

**Note:** Agent users are restricted by `AgentRouteGuard` to only access `/bookings` route

---

## Files Summary

### Core Authentication Files

- `src/contexts/AuthContext.tsx` - Main auth logic
- `src/pages/Auth.tsx` - Auth page router
- `src/components/auth/SignInForm.tsx` - Sign-in UI
- `src/components/auth/SignUpForm.tsx` - Customer sign-up UI
- `src/components/auth/VendorSignUpForm.tsx` - Vendor/Agent sign-up UI
- `src/hooks/useUserRole.tsx` - Role detection hook

### Database Files

- `supabase/migrations/20250614105049-*.sql` - Initial schema
- `supabase/migrations/20250728170946-*.sql` - Security fixes
- `supabase/migrations/20250728171304-*.sql` - Additional security

### Edge Functions

- `supabase/functions/check-user-exists/index.ts` - Email validation

---

## Recommendations for Major Changes

Before making changes, consider:

1. **Fix Agent Role Issue**

   - Add 'agent' to database enum type
   - Update all migration files
   - Test existing agent users

2. **Store Company Name**

   - Add `company_name` field to profiles table
   - Update signup flow to save company name

3. **Improve Error Handling**

   - Show clear errors when role assignment fails
   - Validate role before signup attempt

4. **OAuth Role Assignment**

   - Implement role selection for OAuth users
   - Or default OAuth users to customer only

5. **Email Confirmation**
   - Clarify if email confirmation is required
   - Handle unconfirmed users appropriately

---

## Current User Type Support Matrix

| User Type | Sign-Up Form        | Database Enum | Code Support | Status         |
| --------- | ------------------- | ------------- | ------------ | -------------- |
| Customer  | ✅ SignUpForm       | ✅ Yes        | ✅ Full      | ✅ Working     |
| Vendor    | ✅ VendorSignUpForm | ✅ Yes        | ✅ Full      | ✅ Working     |
| Agent     | ✅ VendorSignUpForm | ❌ No         | ✅ Full      | ⚠️ Broken      |
| Admin     | ❌ No form          | ✅ Yes        | ✅ Full      | ⚠️ Manual only |

---

## Next Steps

1. Review this analysis
2. Identify specific changes needed
3. Plan migration strategy for agent role fix
4. Design new sign-up/sign-in flows if needed
5. Test all user type flows after changes

---

_Analysis Date: Current_
_Codebase Version: As of latest commit_


