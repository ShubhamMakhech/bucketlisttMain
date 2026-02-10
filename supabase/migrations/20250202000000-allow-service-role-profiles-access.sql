-- Fix RLS blocking Edge Functions from accessing profiles
-- The issue: RLS policy "Users can view own profile" only allows users to see their own profile
-- Edge Functions need to query profiles by phone/email for authentication

-- Solution: Add explicit policy for service_role to access profiles
-- Note: service_role should bypass RLS, but this ensures it works

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can access profiles" ON public.profiles;

-- Create policy that allows service_role to read profiles
-- This is needed for Edge Functions to query profiles by phone/email
CREATE POLICY "Service role can access profiles"
ON public.profiles
FOR SELECT
TO service_role
USING (true);

-- Also create a SECURITY DEFINER function as a backup method
-- This function can be called by anyone and will bypass RLS
CREATE OR REPLACE FUNCTION public.check_profile_exists(
  phone_num TEXT DEFAULT NULL,
  email_addr TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  phone_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF phone_num IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.phone_number
    FROM profiles p
    WHERE p.phone_number = phone_num
    LIMIT 1;
  ELSIF email_addr IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.phone_number
    FROM profiles p
    WHERE p.email = email_addr
    LIMIT 1;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_profile_exists(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_profile_exists(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_profile_exists(TEXT, TEXT) TO anon;

