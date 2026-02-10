-- Create storage bucket for booking invoices (if it doesn't exist)
-- Note: Bucket creation should be done via Supabase dashboard or CLI
-- This migration only creates the storage policies

-- Create storage policies for booking invoices
CREATE POLICY "Anyone can view booking invoices" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'booking-invoices');

CREATE POLICY "Authenticated users can upload booking invoices" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'booking-invoices' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update booking invoices" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'booking-invoices' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete booking invoices" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'booking-invoices' AND 
  auth.uid() IS NOT NULL
);

