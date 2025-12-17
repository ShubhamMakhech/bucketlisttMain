
-- Add more detailed fields to destinations table
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS best_time_to_visit TEXT;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS recommended_duration TEXT;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS weather_info JSONB;

-- Create categories table for activity filtering
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert categories based on bucketlistt's structure
INSERT INTO public.categories (name, icon, color) VALUES
('Observation decks', '🏢', 'blue'),
('Tours', '🚌', 'orange'),
('Hotels', '🏨', 'yellow'),
('Car rentals', '🚗', 'green'),
('Cruises', '🚢', 'blue'),
('Museums', '🏛️', 'teal'),
('Water activities', '🏊', 'blue'),
('Theme parks', '🎢', 'purple'),
('Food & drinks', '🍽️', 'red'),
('Outdoor & sports', '⛰️', 'green'),
('Events & shows', '🎭', 'pink');

-- Add category_id to experiences table
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Create attractions/sights table
CREATE TABLE IF NOT EXISTS public.attractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id UUID REFERENCES public.destinations(id),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update destinations with more detailed data
UPDATE public.destinations SET
  best_time_to_visit = 'NOV - FEB',
  recommended_duration = '3 days',
  timezone = 'GMT +04:00',
  currency = 'AED',
  language = 'Arabic',
  weather_info = '{"nov_apr": {"temp": "31°", "desc": "Cool and pleasant"}, "may_oct": {"temp": "41°", "desc": "Hot and humid"}}'
WHERE title = 'Japan';

-- Add more experiences for different destinations
INSERT INTO public.experiences (title, category, image_url, rating, reviews_count, price, original_price, duration, group_size, location, is_special_offer, description, destination_id) VALUES
('Burj Khalifa Observatory Deck', 'Observation decks', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 4.5, 9148, 42.85, 55.00, '2 hours', 'Up to 20', 'Dubai', false, 'Experience breathtaking views from the worlds tallest building', (SELECT id FROM destinations WHERE title = 'Japan' LIMIT 1)),
('Desert Safari Dubai', 'Tours', 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 4.6, 15420, 34.75, 45.00, '6 hours', 'Up to 40', 'Dubai', true, 'Experience the thrill of dune bashing and traditional Bedouin culture', (SELECT id FROM destinations WHERE title = 'Japan' LIMIT 1)),
('Museum of the Future', 'Museums', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 4.4, 1578, 43.29, NULL, '3 hours', 'Up to 15', 'Dubai', false, 'Explore innovation and future technologies in this architectural marvel', (SELECT id FROM destinations WHERE title = 'Japan' LIMIT 1));

-- Insert attractions/sights
INSERT INTO public.attractions (destination_id, title, description, image_url, category) VALUES
((SELECT id FROM destinations WHERE title = 'Japan' LIMIT 1), 'Desert Safari', 'Desert Safari is a must-visit tourist spot for adventure seekers and nature lovers. Located in the heart of the desert, it offers a thrilling experience of dune bashing, camel riding, and traditional entertainment.', 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'Adventure'),
((SELECT id FROM destinations WHERE title = 'Japan' LIMIT 1), 'Dhow Cruise Dubai', 'Dhow Cruise Dubai is a must-visit tourist spot that offers a unique and enchanting experience. The cruise takes you along the Dubai Creek, showcasing the citys stunning skyline and traditional architecture.', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'Cruise'),
((SELECT id FROM destinations WHERE title = 'Japan' LIMIT 1), 'The Dubai Yacht', 'The Dubai Yacht is a must-visit tourist spot in Dubai, United Arab Emirates. This luxurious yacht offers a unique and unforgettable experience for visitors seeking adventure and relaxation on the waters.', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'Water Activities'),
((SELECT id FROM destinations WHERE title = 'Japan' LIMIT 1), 'Burj Khalifa', 'Dubais Burj Khalifa is a must-visit tourist spot for several reasons. Standing at a staggering height of 828 meters, it is the tallest building in the world and offers breathtaking panoramic views of the city.', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'Architecture');

-- Enable RLS for new tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access on attractions" ON public.attractions FOR SELECT USING (true);
