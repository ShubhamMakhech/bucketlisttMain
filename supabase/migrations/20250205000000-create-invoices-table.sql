-- Create invoices table to store invoice data
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  booking_number TEXT NOT NULL UNIQUE, -- Format: YYMMDD + order count (e.g., 26011801)
  invoice_number TEXT NOT NULL UNIQUE, -- Tax invoice number
  invoice_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Customer details
  customer_name TEXT NOT NULL,
  customer_address TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  
  -- Experience details
  experience_title TEXT NOT NULL,
  activity_name TEXT,
  date_time TEXT,
  total_participants INTEGER NOT NULL DEFAULT 1,
  
  -- Pricing details
  original_price_per_person NUMERIC NOT NULL DEFAULT 0,
  base_price_per_person NUMERIC NOT NULL DEFAULT 0,
  tax_amount_per_person NUMERIC NOT NULL DEFAULT 0,
  total_price_per_person NUMERIC NOT NULL DEFAULT 0,
  discount_per_person NUMERIC NOT NULL DEFAULT 0,
  net_price_per_person NUMERIC NOT NULL DEFAULT 0,
  
  -- Totals
  total_base_price NUMERIC NOT NULL DEFAULT 0,
  total_tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_discount NUMERIC NOT NULL DEFAULT 0,
  total_net_price NUMERIC NOT NULL DEFAULT 0,
  
  -- Currency
  currency TEXT NOT NULL DEFAULT 'INR',
  
  -- Vendor details
  vendor_name TEXT,
  vendor_address TEXT,
  vendor_gst TEXT,
  place_of_supply TEXT,
  hsn_code TEXT DEFAULT '999799',
  logo_url TEXT,
  
  -- Invoice type
  invoice_type TEXT NOT NULL DEFAULT 'tax' CHECK (invoice_type IN ('tax', 'booking')),
  
  -- Additional booking invoice fields (for booking invoice type)
  pick_up_location TEXT,
  spot_location TEXT,
  spot_location_url TEXT,
  amount_paid TEXT,
  amount_to_be_paid TEXT,
  advance_plus_discount TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_number ON public.invoices(booking_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
-- Users can view invoices for their bookings
CREATE POLICY "Users can view invoices for their bookings" 
  ON public.invoices 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = invoices.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

-- Vendors can view invoices for bookings of their experiences
CREATE POLICY "Vendors can view invoices for their experience bookings" 
  ON public.invoices 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      JOIN public.experiences ON experiences.id = bookings.experience_id
      WHERE bookings.id = invoices.booking_id 
      AND experiences.vendor_id = auth.uid()
    )
  );

-- Admins can view all invoices
CREATE POLICY "Admins can view all invoices" 
  ON public.invoices 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Service role can insert invoices (for backend functions)
CREATE POLICY "Service role can insert invoices" 
  ON public.invoices 
  FOR INSERT 
  WITH CHECK (true);

-- Users can insert invoices for their bookings
CREATE POLICY "Users can insert invoices for their bookings" 
  ON public.invoices 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = invoices.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

-- Vendors can insert invoices for bookings of their experiences
CREATE POLICY "Vendors can insert invoices for their experience bookings" 
  ON public.invoices 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings 
      JOIN public.experiences ON experiences.id = bookings.experience_id
      WHERE bookings.id = invoices.booking_id 
      AND experiences.vendor_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();
