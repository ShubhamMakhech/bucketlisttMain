
-- Check if the enum exists and create it if it doesn't
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'customer', 'vendor');
    END IF;
END $$;

-- Ensure the function exists with the correct signature
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, first_name, last_name, phone_number, terms_accepted)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'phone_number', ''),
    COALESCE((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false)
  );
  
  -- Insert into user_roles table with explicit casting
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    CASE 
      WHEN new.raw_user_meta_data ->> 'role' IN ('admin', 'customer', 'vendor') 
      THEN (new.raw_user_meta_data ->> 'role')::public.app_role
      ELSE 'customer'::public.app_role
    END
  );
  
  RETURN new;
END;
$$;

-- Drop and recreate the trigger to ensure it's properly linked
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
