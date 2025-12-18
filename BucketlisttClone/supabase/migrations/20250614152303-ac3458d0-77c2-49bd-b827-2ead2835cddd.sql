
-- Create storage policies for experience images (bucket already exists)
CREATE POLICY "Anyone can view experience images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'experience-images');

CREATE POLICY "Authenticated users can upload experience images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'experience-images' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own experience images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'experience-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own experience images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'experience-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
