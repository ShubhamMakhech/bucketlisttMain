-- Add rich-text columns for experience detail sections (same as description)
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS highlights TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS inclusion TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS exclusion TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS eligibility TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS location_info TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS operating_hours TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS faqs TEXT;
