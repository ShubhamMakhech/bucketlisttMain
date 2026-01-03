-- Create a function to update user email directly in auth.users table
-- This bypasses any API limitations and updates the email immediately

CREATE OR REPLACE FUNCTION public.update_user_email(
  user_id UUID,
  new_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO auth, public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Validate email format
  IF new_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid email format'
    );
  END IF;

  -- Check if email is already in use by another user
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = new_email AND id != user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email is already in use'
    );
  END IF;

  -- Update email in auth.users
  UPDATE auth.users
  SET 
    email = new_email,
    email_confirmed_at = COALESCE(email_confirmed_at, now()), -- Keep existing confirmation or set to now
    updated_at = now()
  WHERE id = user_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Update email in profiles table
  UPDATE public.profiles
  SET 
    email = new_email,
    updated_at = now()
  WHERE id = user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Email updated successfully'
  );
END;
$$;

-- Grant execute permission to service_role and authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_email(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_email(UUID, TEXT) TO authenticated;

