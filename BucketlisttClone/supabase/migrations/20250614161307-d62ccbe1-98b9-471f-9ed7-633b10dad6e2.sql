
-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  experience_id UUID REFERENCES public.experiences(id) NOT NULL,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  note_for_guide TEXT,
  total_participants INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'confirmed',
  terms_accepted BOOLEAN NOT NULL DEFAULT true,
  referral_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking participants table
CREATE TABLE public.booking_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookings
CREATE POLICY "Users can view their own bookings" 
  ON public.bookings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" 
  ON public.bookings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
  ON public.bookings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for booking participants
CREATE POLICY "Users can view participants of their bookings" 
  ON public.booking_participants 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_participants.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create participants for their bookings" 
  ON public.booking_participants 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_participants.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update participants of their bookings" 
  ON public.booking_participants 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_participants.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete participants of their bookings" 
  ON public.booking_participants 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_participants.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );
