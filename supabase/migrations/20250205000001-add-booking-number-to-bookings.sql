-- Add booking_number field to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_number TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON public.bookings(booking_number);

-- Create function to generate booking number (YYMMDD + order count)
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
DECLARE
  today_prefix TEXT;
  today_count INTEGER;
  booking_num TEXT;
BEGIN
  -- Get today's date in YYMMDD format
  today_prefix := TO_CHAR(CURRENT_DATE, 'YYMMDD');
  
  -- Count bookings created today with booking_number starting with today's prefix
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(booking_number FROM 7) AS INTEGER)
  ), 0) + 1
  INTO today_count
  FROM public.bookings
  WHERE booking_number LIKE today_prefix || '%';
  
  -- Generate booking number: YYMMDD + count (padded to 2 digits)
  booking_num := today_prefix || LPAD(today_count::TEXT, 2, '0');
  
  RETURN booking_num;
END;
$$ LANGUAGE plpgsql;
