
-- Create images table for experience galleries
CREATE TABLE experience_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_experience_images_experience_id ON experience_images(experience_id);
CREATE INDEX idx_experience_images_display_order ON experience_images(experience_id, display_order);

-- Add RLS policies (making it public readable since experiences are public)
ALTER TABLE experience_images ENABLE ROW LEVEL SECURITY;

-- Policy to allow public read access
CREATE POLICY "Allow public read access to experience images" 
  ON experience_images 
  FOR SELECT 
  USING (true);
