-- Update profiles table to allow null first_name and last_name
-- This is needed for OTP-based signup where we don't collect names initially
ALTER TABLE public.profiles 
  ALTER COLUMN first_name DROP NOT NULL,
  ALTER COLUMN last_name DROP NOT NULL;

-- Update the handle_new_user trigger to handle null names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles table (first_name and last_name can be null)
  INSERT INTO public.profiles (id, email, first_name, last_name, phone_number, terms_accepted)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'first_name', NULL),
    COALESCE(new.raw_user_meta_data ->> 'last_name', NULL),
    COALESCE(new.raw_user_meta_data ->> 'phone_number', NULL),
    COALESCE((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false)
  );
  
  -- Insert into user_roles table with explicit casting
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    CASE 
      WHEN new.raw_user_meta_data ->> 'role' IN ('admin', 'customer', 'vendor', 'agent') 
      THEN (new.raw_user_meta_data ->> 'role')::public.app_role
      ELSE 'customer'::public.app_role
    END
  );
  
  RETURN new;
END;
$function$;



