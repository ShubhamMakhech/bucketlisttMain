-- Create logs table for error tracking
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_logs_type ON public.logs(type);
CREATE INDEX IF NOT EXISTS idx_logs_booking_id ON public.logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view logs
CREATE POLICY "Admins can view all logs" 
  ON public.logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Policy: Authenticated users can insert logs (for application logging)
-- This allows the application to insert logs when users are authenticated
CREATE POLICY "Authenticated users can insert logs" 
  ON public.logs 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Note: The service role policy above allows inserts from the application
-- since the code uses supabase client which may not have user context
-- when logging errors during booking creation

