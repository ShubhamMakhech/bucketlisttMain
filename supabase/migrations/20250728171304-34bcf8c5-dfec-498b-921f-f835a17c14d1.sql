-- Critical Security Fix: Add missing RLS policies for user roles

-- Prevent users from updating their own roles to admin or changing roles
CREATE POLICY "Users cannot modify their own roles" 
ON public.user_roles 
FOR UPDATE 
USING (false);

-- Prevent users from deleting their roles
CREATE POLICY "Users cannot delete their own roles" 
ON public.user_roles 
FOR DELETE 
USING (false);

-- Fix function search path vulnerabilities by updating existing functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update has_role function to be more secure
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;