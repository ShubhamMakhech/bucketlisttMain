-- Verification script to check if admin_note column exists
-- Run this in your Supabase SQL editor to verify the migration

-- Check if column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'bookings' 
  AND column_name = 'admin_note';

-- If the above returns no rows, run the migration:
-- ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- Test insert/update (as admin)
-- UPDATE bookings SET admin_note = 'Test note' WHERE id = 'some-booking-id';

