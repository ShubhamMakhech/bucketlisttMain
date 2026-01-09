-- Add for_agent column to experiences table
ALTER TABLE public.experiences 
ADD COLUMN IF NOT EXISTS for_agent BOOLEAN NOT NULL DEFAULT false;

-- Add comment to the column
COMMENT ON COLUMN public.experiences.for_agent IS 'Flag to indicate if experience is available for agents to book';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_experiences_for_agent ON public.experiences(for_agent) WHERE for_agent = true;

