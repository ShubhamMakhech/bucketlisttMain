-- Add logo_url column to experiences table
ALTER TABLE public.experiences 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.experiences.logo_url IS 'URL of the logo image for the experience';

