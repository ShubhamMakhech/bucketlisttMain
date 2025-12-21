-- ============================================================================
-- OTP AUTHENTICATION MIGRATION
-- ============================================================================
-- IMPORTANT: This migration is idempotent and safe to run multiple times
-- Test thoroughly in local/staging before applying to production
-- ============================================================================

-- Add auth_method column to profiles table (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'auth_method'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN auth_method TEXT CHECK (auth_method IN ('email', 'phone', 'google'));
    
    RAISE NOTICE 'Added auth_method column to profiles table';
  ELSE
    RAISE NOTICE 'auth_method column already exists, skipping';
  END IF;
END $$;

-- Make first_name and last_name nullable for OTP-based signups (keep columns, just allow NULL)
-- This allows users to sign up with OTP and fill in these details later
-- SAFE: Only modifies constraints, does not drop columns or data
DO $$ 
BEGIN
  -- Only alter if the columns are currently NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'first_name' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN first_name DROP NOT NULL;
    RAISE NOTICE 'Made first_name nullable';
  ELSE
    RAISE NOTICE 'first_name is already nullable or does not exist';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'last_name' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN last_name DROP NOT NULL;
    RAISE NOTICE 'Made last_name nullable';
  ELSE
    RAISE NOTICE 'last_name is already nullable or does not exist';
  END IF;
END $$;

-- Create OTP table for temporary OTP storage (idempotent)
-- SAFE: Creates new table, does not modify existing data
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- email or phone number
  otp TEXT NOT NULL,
  auth_method TEXT NOT NULL CHECK (auth_method IN ('email', 'phone')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT otp_identifier_method_unique UNIQUE (identifier, auth_method, verified)
);

-- Create indexes for faster lookups (idempotent)
-- SAFE: Indexes improve performance, safe to create multiple times
CREATE INDEX IF NOT EXISTS idx_otp_identifier ON public.otp_verifications(identifier, auth_method);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON public.otp_verifications(expires_at);

-- Enable RLS on OTP table (idempotent)
-- SAFE: RLS is already enabled if table exists, this is a no-op
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (idempotent - DROP IF EXISTS then CREATE)
-- SAFE: Policies control access, safe to recreate
DROP POLICY IF EXISTS "Anyone can create OTP" ON public.otp_verifications;
CREATE POLICY "Anyone can create OTP"
ON public.otp_verifications
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can verify OTP" ON public.otp_verifications;
CREATE POLICY "Anyone can verify OTP"
ON public.otp_verifications
FOR UPDATE
TO public
USING (true);

-- Allow cleanup of expired OTPs (via service role)
-- This will be done via cron job or service role

-- Function to clean up expired OTPs (idempotent)
-- SAFE: CREATE OR REPLACE is safe, only updates function definition
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.otp_verifications
  WHERE expires_at < NOW() OR verified = true;
END;
$$;

-- Update handle_new_user function to support OTP-based signups (idempotent)
-- first_name and last_name can be NULL initially and filled in later
-- SAFE: CREATE OR REPLACE updates function, does not affect existing data
-- This function is called by trigger, so existing users are not affected
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone_number, terms_accepted, auth_method)
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    -- Allow NULL for first_name and last_name (can be filled in later)
    NULLIF(TRIM(new.raw_user_meta_data ->> 'first_name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data ->> 'last_name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data ->> 'phone_number'), ''),
    COALESCE((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false),
    COALESCE(new.raw_user_meta_data ->> 'auth_method', 'email')::TEXT
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data ->> 'role')::app_role, 'customer')
  )
  ON CONFLICT (user_id, role) DO NOTHING; -- Prevent errors if role already exists
  
  RETURN new;
END;
$$;

