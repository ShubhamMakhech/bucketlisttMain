-- Create OTP verifications table for email and SMS OTP
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- email or phone number
  otp TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms')),
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_identifier_type ON public.otp_verifications(identifier, type);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON public.otp_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage OTPs (for edge functions)
-- Note: Edge functions use service role, so they can access this table
-- Regular users don't need direct access to this table

-- Clean up expired OTPs (older than 1 hour) periodically
-- This can be done via a cron job or manually



