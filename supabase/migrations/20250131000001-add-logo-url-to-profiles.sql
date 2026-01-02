-- Add logo_url field to profiles table for vendor logos
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.profiles.logo_url IS 'URL to the vendor logo image, used in booking PDFs';

