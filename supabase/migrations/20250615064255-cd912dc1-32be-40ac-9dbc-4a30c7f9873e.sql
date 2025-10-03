
-- Create time_slots table to store available time slots for each experience
CREATE TABLE public.time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for time_slots
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view time slots (needed for booking selection)
CREATE POLICY "Anyone can view time slots" 
  ON public.time_slots 
  FOR SELECT 
  TO public
  USING (true);

-- Only vendors can manage their experience time slots
CREATE POLICY "Vendors can manage their experience time slots" 
  ON public.time_slots 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.experiences 
      WHERE experiences.id = time_slots.experience_id 
      AND experiences.vendor_id = auth.uid()
    )
  );

-- Add time_slot_id to bookings table to track which slot was booked
ALTER TABLE public.bookings 
ADD COLUMN time_slot_id UUID REFERENCES public.time_slots(id),
ADD COLUMN booking_time TIME;

-- Create index for better performance
CREATE INDEX idx_time_slots_experience_id ON public.time_slots(experience_id);
CREATE INDEX idx_bookings_time_slot_id ON public.bookings(time_slot_id);

-- Create a view to get slot availability
CREATE OR REPLACE VIEW public.slot_availability AS
SELECT 
  ts.id,
  ts.experience_id,
  ts.start_time,
  ts.end_time,
  ts.capacity,
  COALESCE(SUM(b.total_participants), 0) as booked_count,
  (ts.capacity - COALESCE(SUM(b.total_participants), 0)) as available_spots
FROM public.time_slots ts
LEFT JOIN public.bookings b ON ts.id = b.time_slot_id 
  AND DATE(b.booking_date) = CURRENT_DATE -- This will need to be parameterized in queries
GROUP BY ts.id, ts.experience_id, ts.start_time, ts.end_time, ts.capacity;
