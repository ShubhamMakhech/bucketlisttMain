
-- Create a junction table for the many-to-many relationship between experiences and categories
CREATE TABLE public.experience_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(experience_id, category_id)
);

-- Enable RLS on the junction table
ALTER TABLE public.experience_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for the junction table (public read access since experiences and categories are public)
CREATE POLICY "Anyone can view experience categories" 
  ON public.experience_categories 
  FOR SELECT 
  USING (true);

-- Create policy for inserting experience categories (if needed for admin functionality later)
CREATE POLICY "Authenticated users can manage experience categories" 
  ON public.experience_categories 
  FOR ALL 
  USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_experience_categories_experience_id ON public.experience_categories(experience_id);
CREATE INDEX idx_experience_categories_category_id ON public.experience_categories(category_id);

-- Note: We'll keep the existing 'category' column in experiences table for now to avoid breaking existing data
-- The old column can be removed later after migrating data to the new structure
