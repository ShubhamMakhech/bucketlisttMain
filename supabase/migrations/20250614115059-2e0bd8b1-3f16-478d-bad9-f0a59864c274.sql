
-- Create a table for user favorites
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, experience_id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own favorites
CREATE POLICY "Users can view their own favorites" 
  ON public.favorites 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to create their own favorites
CREATE POLICY "Users can create their own favorites" 
  ON public.favorites 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to delete their own favorites
CREATE POLICY "Users can delete their own favorites" 
  ON public.favorites 
  FOR DELETE 
  USING (auth.uid() = user_id);
