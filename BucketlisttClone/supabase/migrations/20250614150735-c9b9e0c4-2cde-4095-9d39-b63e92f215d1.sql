
-- Add days_open column to experiences table to store operating days
ALTER TABLE experiences ADD COLUMN days_open TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add vendor_id column to track which vendor created the experience
ALTER TABLE experiences ADD COLUMN vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create RLS policies for vendors to manage their own experiences
CREATE POLICY "Vendors can insert their own experiences" 
  ON experiences 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = vendor_id AND 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'vendor'
    )
  );

CREATE POLICY "Vendors can update their own experiences" 
  ON experiences 
  FOR UPDATE 
  USING (
    auth.uid() = vendor_id AND 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'vendor'
    )
  );

CREATE POLICY "Vendors can delete their own experiences" 
  ON experiences 
  FOR DELETE 
  USING (
    auth.uid() = vendor_id AND 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'vendor'
    )
  );

-- Add RLS policies for experience_images
CREATE POLICY "Vendors can insert images for their experiences" 
  ON experience_images 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM experiences e
      JOIN user_roles ur ON e.vendor_id = ur.user_id
      WHERE e.id = experience_id 
      AND ur.user_id = auth.uid() 
      AND ur.role = 'vendor'
    )
  );

CREATE POLICY "Vendors can update images for their experiences" 
  ON experience_images 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM experiences e
      JOIN user_roles ur ON e.vendor_id = ur.user_id
      WHERE e.id = experience_id 
      AND ur.user_id = auth.uid() 
      AND ur.role = 'vendor'
    )
  );

CREATE POLICY "Vendors can delete images for their experiences" 
  ON experience_images 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM experiences e
      JOIN user_roles ur ON e.vendor_id = ur.user_id
      WHERE e.id = experience_id 
      AND ur.user_id = auth.uid() 
      AND ur.role = 'vendor'
    )
  );
