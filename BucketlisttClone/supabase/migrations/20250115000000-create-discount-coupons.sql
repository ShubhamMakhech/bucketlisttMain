-- Create discount_coupons table
CREATE TABLE public.discount_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('flat', 'percentage')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  max_uses INTEGER DEFAULT NULL, -- NULL means unlimited uses
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure coupon code is unique per experience
  UNIQUE(experience_id, coupon_code)
);

-- Add indexes for better performance
CREATE INDEX idx_discount_coupons_experience_id ON public.discount_coupons(experience_id);
CREATE INDEX idx_discount_coupons_coupon_code ON public.discount_coupons(coupon_code);
CREATE INDEX idx_discount_coupons_active ON public.discount_coupons(is_active);

-- Enable Row Level Security
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active coupons (needed for validation)
CREATE POLICY "Anyone can view active coupons" 
  ON public.discount_coupons 
  FOR SELECT 
  USING (is_active = true);

-- Policy: Only vendors can manage coupons for their experiences
CREATE POLICY "Vendors can manage coupons for their experiences" 
  ON public.discount_coupons 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.experiences 
      WHERE experiences.id = discount_coupons.experience_id 
      AND experiences.vendor_id = auth.uid()
    )
  );

-- Policy: Admins can manage all coupons
CREATE POLICY "Admins can manage all coupons" 
  ON public.discount_coupons 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Add validation constraints
ALTER TABLE public.discount_coupons 
ADD CONSTRAINT check_percentage_discount 
CHECK (
  (type = 'percentage' AND discount_value <= 100) OR 
  (type = 'flat')
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_discount_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_discount_coupons_updated_at
  BEFORE UPDATE ON public.discount_coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_discount_coupons_updated_at();
