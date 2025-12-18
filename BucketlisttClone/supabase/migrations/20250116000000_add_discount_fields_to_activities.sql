-- Add discount fields to activities table
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10,2) DEFAULT 0 CHECK (discounted_price >= 0);

-- Add comments for clarity
COMMENT ON COLUMN public.activities.discount_percentage IS 'Discount percentage (0-100)';
COMMENT ON COLUMN public.activities.discounted_price IS 'Calculated discounted price';

-- Create function to automatically calculate discounted price
CREATE OR REPLACE FUNCTION public.calculate_discounted_price()
RETURNS TRIGGER AS $$
BEGIN
  NEW.discounted_price = NEW.price - (NEW.price * NEW.discount_percentage / 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update discounted price
CREATE TRIGGER update_discounted_price
  BEFORE INSERT OR UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_discounted_price();

-- Update existing activities to have calculated discounted prices
UPDATE public.activities 
SET discounted_price = price - (price * discount_percentage / 100)
WHERE discounted_price = 0 AND price > 0;
