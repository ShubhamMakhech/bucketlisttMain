-- Add fields for offline bookings
-- booked_by: UUID of the vendor who created the offline booking
-- type: 'online' or 'offline' to distinguish booking types
-- activity_id: Direct reference to activity (for offline bookings that don't use time slots)

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'online' CHECK (type IN ('online', 'offline')),
ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES public.activities(id),
ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
ADD COLUMN IF NOT EXISTS contact_person_number TEXT,
ADD COLUMN IF NOT EXISTS contact_person_email TEXT,
ADD COLUMN IF NOT EXISTS booking_amount NUMERIC,
ADD COLUMN IF NOT EXISTS due_amount NUMERIC,
ADD COLUMN IF NOT EXISTS b2bPrice NUMERIC,
ADD COLUMN IF NOT EXISTS isAgentBooking BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_booked_by ON public.bookings(booked_by);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON public.bookings(type);
CREATE INDEX IF NOT EXISTS idx_bookings_activity_id ON public.bookings(activity_id);

-- Update RLS policies to allow vendors to create bookings for their experiences
-- This is needed for offline bookings where vendor creates booking on behalf of customer
-- Drop policy if it exists first
DROP POLICY IF EXISTS "Vendors can create bookings for their experiences" ON public.bookings;
CREATE POLICY "Vendors can create bookings for their experiences" 
ON public.bookings 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.experiences 
    WHERE experiences.id = bookings.experience_id 
    AND experiences.vendor_id = auth.uid()
  )
);

-- Allow vendors to view bookings for their experiences (including offline bookings)
-- Drop policy if it exists first
DROP POLICY IF EXISTS "Vendors can view bookings for their experiences" ON public.bookings;
CREATE POLICY "Vendors can view bookings for their experiences" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.experiences 
    WHERE experiences.id = bookings.experience_id 
    AND experiences.vendor_id = auth.uid()
  )
  OR auth.uid() = user_id
  OR auth.uid() = booked_by
);

