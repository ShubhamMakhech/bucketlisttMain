-- Add location2 column to experiences table
ALTER TABLE public.experiences 
ADD COLUMN IF NOT EXISTS location2 TEXT;

-- Ensure RLS is enabled on experiences table
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Create or replace SELECT policy to allow public read access to experiences
-- This ensures location2 (and all other columns) can be accessed through queries
DROP POLICY IF EXISTS "Allow public read access on experiences" ON public.experiences;
CREATE POLICY "Allow public read access on experiences" 
  ON public.experiences 
  FOR SELECT 
  USING (true);

-- Note: The existing vendor policies for INSERT, UPDATE, DELETE remain unchanged
-- This only adds public SELECT access which is needed for the booking flow
