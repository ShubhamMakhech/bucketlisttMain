-- Add 'canceled' to booking type constraint
-- This allows bookings to be marked as canceled in addition to 'online' and 'offline'

-- First, drop the existing constraint
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_type_check;

-- Add the new constraint with 'canceled' included
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_type_check CHECK (type IN ('online', 'offline', 'canceled'));

