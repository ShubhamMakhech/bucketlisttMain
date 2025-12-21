# User Sign Up and Sign In Process Analysis

## Overview

This document provides a comprehensive analysis of the authentication flow for users (role: "customer") in the bucketlistt application.

---

## 1. Sign Up Process

### 1.1 User Interface

**Location:** `src/components/auth/SignUpForm.tsx`

**Form Fields:**

- First Name (required)
- Last Name (required)
- Email (required)
- Phone Number (optional)
- Password (required)
- Confirm Password (required)
- Terms & Conditions checkbox (required)

**Key Observations:**

- Role is **hardcoded to "customer"** (line 33: `role: "customer" as "customer" | "vendor"`)
- No UI element allows users to select a role
- Role selection UI is commented out or removed (line 168-169 shows a comment about "Role Selection - Fixed to Traveller")

### 1.2 Sign Up Flow

#### Step 1: Form Validation

```typescript
// Validations performed:
1. Password match validation (password === confirmPassword)
2. Terms acceptance validation (termsAccepted must be true)
```

#### Step 2: Email Existence Check

**Location:** `src/contexts/AuthContext.tsx` (lines 66-92)

**Process:**

1. Calls Supabase Edge Function: `check-user-exists`
2. Edge Function checks `profiles` table for existing email
3. Returns error if user already exists with code: `user_already_exists`

**Edge Function:** `supabase/functions/check-user-exists/index.ts`

- Uses service role key for secure database access
- Queries `profiles` table by email
- Returns `{ userExists: boolean }`

#### Step 3: Supabase Auth Sign Up

**Location:** `src/contexts/AuthContext.tsx` (lines 96-109)

**Process:**

```typescript
supabase.auth.signUp({
  email: data.email,
  password: data.password,
  options: {
    emailRedirectTo: "https://www.bucketlistt.com/auth",
    data: {
      first_name: data.firstName,
      last_name: data.lastName,
      phone_number: data.phoneNumber,
      role: data.role, // Always "customer"
      terms_accepted: data.termsAccepted,
    },
  },
});
```

**Metadata Stored:**

- `first_name`
- `last_name`
- `phone_number`
- `role` (always "customer")
- `terms_accepted`

#### Step 4: Database Trigger Execution

**Location:** `supabase/migrations/20250614110055-*.sql`

**Trigger:** `on_auth_user_created` (fires AFTER INSERT on `auth.users`)

**Function:** `handle_new_user()`

**Actions:**

1. **Creates Profile Record:**

   ```sql
   INSERT INTO profiles (id, email, first_name, last_name, phone_number, terms_accepted)
   VALUES (
     new.id,
     new.email,
     COALESCE(new.raw_user_meta_data->>'first_name', ''),
     COALESCE(new.raw_user_meta_data->>'last_name', ''),
     COALESCE(new.raw_user_meta_data->>'phone_number', ''),
     COALESCE((new.raw_user_meta_data->>'terms_accepted')::boolean, false)
   )
   ```

2. **Creates User Role Record:**
   ```sql
   INSERT INTO user_roles (user_id, role)
   VALUES (
     new.id,
     CASE
       WHEN new.raw_user_meta_data->>'role' IN ('admin', 'customer', 'vendor')
       THEN (new.raw_user_meta_data->>'role')::app_role
       ELSE 'customer'::app_role  -- Default fallback
     END
   )
   ```

**Important Notes:**

- Role defaults to `'customer'` if not provided or invalid
- Trigger uses `SECURITY DEFINER` to bypass RLS
- Profile and role are created atomically

#### Step 5: Email Confirmation

**Location:** `src/components/auth/SignUpForm.tsx` (lines 119-126)

**Process:**

1. On successful sign up, user is redirected to `/email-confirmation`
2. Email confirmation page (`src/pages/EmailConfirmation.tsx`) displays:
   - Message to check email
   - Confirmation link sent notification
   - Button to return to login page

**Email Configuration:**

- Redirect URL: `https://www.bucketlistt.com/auth`
- User must click confirmation link in email to activate account

---

## 2. Sign In Process

### 2.1 User Interface

**Location:** `src/components/auth/SignInForm.tsx`

**Form Fields:**

- Email (required)
- Password (required)
- "Forgot password?" link

**Authentication Methods:**

1. **Email/Password** (primary)
2. **Google OAuth** (secondary, implemented)

### 2.2 Sign In Flow

#### Method 1: Email/Password Sign In

**Step 1: Form Submission**

```typescript
// Location: src/components/auth/SignInForm.tsx (lines 36-59)
const { error } = await signIn(email, password);
```

**Step 2: Supabase Authentication**
**Location:** `src/contexts/AuthContext.tsx` (lines 58-64)

```typescript
const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { error };
};
```

**Step 3: Auth State Update**
**Location:** `src/contexts/AuthContext.tsx` (lines 33-46)

The `onAuthStateChange` listener automatically:

- Updates session state
- Updates user state
- Sets loading to false

**Step 4: Post-Sign In Navigation**
**Location:** `src/pages/Auth.tsx` (lines 51-59)

```typescript
useEffect(() => {
  if (user && !loading && !roleLoading && !isResetMode) {
    if (isVendor) {
      navigate("/profile"); // Vendors go to profile
    } else {
      navigate("/"); // Customers go to homepage
    }
  }
}, [user, loading, roleLoading, isVendor, navigate, isResetMode]);
```

**Role Retrieval:**

- Uses `useUserRole()` hook
- Queries `user_roles` table for user's role
- Defaults to "customer" if no role found

#### Method 2: Google OAuth Sign In

**Location:** `src/components/auth/SignInForm.tsx` (lines 60-71)

**Process:**

```typescript
const handleGoogleLogin = async () => {
  localStorage.setItem("loggedInPath", window.location.pathname);
  const redirectTo = `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });
};
```

**Important Notes:**

- Stores current path in localStorage for post-login redirect
- No role metadata is passed in OAuth flow
- Database trigger will assign default "customer" role
- OAuth users may have incomplete profile data (no phone_number, terms_accepted)

**Post-OAuth Redirect:**
**Location:** `src/App.tsx` (lines 132-147)

- Checks `localStorage.getItem("loggedInPath")`
- Redirects user back to original page after OAuth callback

---

## 3. Role Management

### 3.1 Role Types

**Database Enum:** `app_role`

- `'admin'`
- `'customer'` (default for users)
- `'vendor'`

**Note:** Code also references `'agent'` role in some places, but it's not in the database enum.

### 3.2 Role Retrieval

**Location:** `src/hooks/useUserRole.tsx`

**Process:**

```typescript
const { data, error } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", user.id)
  .single();

setRole(data?.role || "customer"); // Defaults to customer
```

**Returned Properties:**

- `role`: The user's role
- `isVendor`: boolean
- `isAgent`: boolean (may not work if 'agent' not in enum)
- `isVendorOrAgent`: boolean
- `isAdmin`: boolean
- `isCustomer`: boolean

### 3.3 Row Level Security (RLS)

**Policies for `user_roles` table:**

1. **SELECT:** Users can view their own roles
2. **INSERT:** Users can insert their own role during signup
3. **UPDATE:** Users **cannot** modify their own roles (security policy)
4. **DELETE:** Users **cannot** delete their own roles (security policy)

**Security Note:**

- Role modifications must be done by admins or through database functions
- Prevents privilege escalation attacks

---

## 4. Database Schema

### 4.1 Tables

#### `profiles` Table

```sql
- id (UUID, PK, references auth.users)
- email (TEXT, NOT NULL)
- phone_number (TEXT, nullable)
- first_name (TEXT, NOT NULL)
- last_name (TEXT, NOT NULL)
- profile_picture_url (TEXT, nullable)
- terms_accepted (BOOLEAN, default false)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `user_roles` Table

```sql
- id (UUID, PK)
- user_id (UUID, references auth.users, NOT NULL)
- role (app_role, NOT NULL, default 'customer')
- created_at (TIMESTAMP)
- UNIQUE constraint on (user_id, role)
```

### 4.2 Triggers

**Trigger:** `on_auth_user_created`

- **Event:** AFTER INSERT on `auth.users`
- **Function:** `handle_new_user()`
- **Actions:**
  1. Creates profile record from metadata
  2. Creates user_roles record (defaults to 'customer')

---

## 5. Error Handling

### 5.1 Sign Up Errors

**User Already Exists:**

- Error code: `user_already_exists`
- Message: "User already registered"
- UI: Shows toast with link to sign in page

**Email Validation Failure:**

- Message: "Failed to validate email. Please try again."
- Occurs when Edge Function fails

**Other Errors:**

- Generic error message displayed
- Error logged to console

### 5.2 Sign In Errors

**Invalid Credentials:**

- Supabase returns error with message
- Displayed in toast notification

**Network Errors:**

- Generic "An error occurred" message
- User prompted to try again

---

## 6. Security Considerations

### 6.1 Strengths

1. ✅ Email confirmation required for new accounts
2. ✅ Password validation (client-side)
3. ✅ RLS policies prevent unauthorized role access
4. ✅ Users cannot modify their own roles
5. ✅ Edge function uses service role key (secure)
6. ✅ Terms acceptance tracked in database

### 6.2 Potential Issues

1. **Role Hardcoding:**

   - Role is hardcoded to "customer" in SignUpForm
   - No way for users to select different roles (intentional, but inflexible)

2. **OAuth Profile Incompleteness:**

   - Google OAuth users may not have phone_number or terms_accepted
   - Could cause issues if these fields are required elsewhere

3. **Agent Role Mismatch:**

   - Code references 'agent' role but database enum doesn't include it
   - Could cause runtime errors

4. **Email Redirect URL:**
   - Hardcoded to production URL: `https://www.bucketlistt.com/auth`
   - May not work in development/staging environments

---

## 7. User Journey Summary

### Sign Up Journey:

1. User fills out sign up form (role = "customer")
2. System checks if email exists
3. Supabase creates auth user with metadata
4. Database trigger creates profile and role records
5. User receives confirmation email
6. User clicks email link → redirected to `/auth`
7. User can now sign in

### Sign In Journey:

1. User enters email/password OR clicks Google OAuth
2. Supabase authenticates user
3. Auth context updates with user/session
4. Role is fetched from `user_roles` table
5. User redirected based on role:
   - Customer → `/` (homepage)
   - Vendor → `/profile`

---

## 8. Recommendations

### 8.1 Immediate Fixes

1. **Fix Agent Role:**

   - Either add 'agent' to database enum OR remove agent references from code

2. **Environment-Based Redirect:**

   - Make email redirect URL configurable based on environment

3. **OAuth Profile Completion:**
   - Add profile completion flow for OAuth users
   - Prompt for missing fields (phone, terms acceptance)

### 8.2 Enhancements

1. **Email Verification Status:**

   - Show verification status in UI
   - Allow resending confirmation emails

2. **Password Strength Validation:**

   - Add client-side password strength meter
   - Enforce minimum requirements

3. **Account Recovery:**

   - Improve password reset flow documentation
   - Add account recovery options

4. **Audit Logging:**
   - Log sign up/sign in events for security monitoring

---

## 9. Code References

### Key Files:

- `src/contexts/AuthContext.tsx` - Core authentication logic
- `src/components/auth/SignUpForm.tsx` - Sign up UI
- `src/components/auth/SignInForm.tsx` - Sign in UI
- `src/pages/Auth.tsx` - Auth page router
- `src/hooks/useUserRole.tsx` - Role management hook
- `supabase/functions/check-user-exists/index.ts` - Email validation
- `supabase/migrations/*.sql` - Database schema and triggers

---

## 10. Testing Checklist

### Sign Up:

- [ ] Valid sign up with all fields
- [ ] Sign up with existing email (should fail)
- [ ] Sign up without terms acceptance (should fail)
- [ ] Password mismatch validation
- [ ] Email confirmation flow
- [ ] Profile and role creation in database

### Sign In:

- [ ] Valid credentials sign in
- [ ] Invalid credentials sign in
- [ ] Google OAuth sign in
- [ ] Post-sign in navigation (customer vs vendor)
- [ ] Role retrieval after sign in

### Edge Cases:

- [ ] OAuth user without profile data
- [ ] User with missing role (should default to customer)
- [ ] Email confirmation link expiration
- [ ] Password reset flow

---

_Analysis completed on: [Current Date]_
_Codebase version: Latest_
