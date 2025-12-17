
-- Add distance, start_point, and end_point columns to experiences table
ALTER TABLE experiences 
ADD COLUMN distance_km INTEGER CHECK (distance_km IN (0, 8, 16, 26)),
ADD COLUMN start_point TEXT,
ADD COLUMN end_point TEXT;

-- Add comments for clarity
COMMENT ON COLUMN experiences.distance_km IS 'Distance in kilometers: 0 = on spot, 8/16/26 = travel distances';
COMMENT ON COLUMN experiences.start_point IS 'Starting location for the experience';
COMMENT ON COLUMN experiences.end_point IS 'Ending location for the experience';
