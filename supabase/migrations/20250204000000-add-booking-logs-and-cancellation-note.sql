-- Create booking_logs table to track all changes to bookings
CREATE TABLE IF NOT EXISTS public.booking_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'canceled', 'restored')),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  cancellation_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add cancellation_note to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS cancellation_note TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_booking_logs_booking_id ON public.booking_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_logs_created_at ON public.booking_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_booking_logs_changed_by ON public.booking_logs(changed_by);

-- Enable Row Level Security
ALTER TABLE public.booking_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_logs
-- Users can view logs for their own bookings
CREATE POLICY "Users can view logs for their own bookings" 
  ON public.booking_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_logs.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

-- Vendors can view logs for bookings of their experiences
CREATE POLICY "Vendors can view logs for their experience bookings" 
  ON public.booking_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      INNER JOIN public.experiences ON experiences.id = bookings.experience_id
      WHERE bookings.id = booking_logs.booking_id 
      AND experiences.vendor_id = auth.uid()
    )
  );

-- Admins can view all logs
CREATE POLICY "Admins can view all booking logs" 
  ON public.booking_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Only authenticated users can insert logs (via triggers or application)
CREATE POLICY "Authenticated users can create booking logs" 
  ON public.booking_logs 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Function to automatically log booking updates
CREATE OR REPLACE FUNCTION log_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[];
  field_name TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  -- Check each field that might have changed
  IF OLD.contact_person_name IS DISTINCT FROM NEW.contact_person_name THEN
    INSERT INTO public.booking_logs (booking_id, action, field_name, old_value, new_value, changed_by)
    VALUES (
      NEW.id,
      'updated',
      'contact_person_name',
      COALESCE(OLD.contact_person_name::TEXT, ''),
      COALESCE(NEW.contact_person_name::TEXT, ''),
      auth.uid()
    );
  END IF;

  IF OLD.contact_person_number IS DISTINCT FROM NEW.contact_person_number THEN
    INSERT INTO public.booking_logs (booking_id, action, field_name, old_value, new_value, changed_by)
    VALUES (
      NEW.id,
      'updated',
      'contact_person_number',
      COALESCE(OLD.contact_person_number::TEXT, ''),
      COALESCE(NEW.contact_person_number::TEXT, ''),
      auth.uid()
    );
  END IF;

  IF OLD.contact_person_email IS DISTINCT FROM NEW.contact_person_email THEN
    INSERT INTO public.booking_logs (booking_id, action, field_name, old_value, new_value, changed_by)
    VALUES (
      NEW.id,
      'updated',
      'contact_person_email',
      COALESCE(OLD.contact_person_email::TEXT, ''),
      COALESCE(NEW.contact_person_email::TEXT, ''),
      auth.uid()
    );
  END IF;

  IF OLD.total_participants IS DISTINCT FROM NEW.total_participants THEN
    INSERT INTO public.booking_logs (booking_id, action, field_name, old_value, new_value, changed_by)
    VALUES (
      NEW.id,
      'updated',
      'total_participants',
      COALESCE(OLD.total_participants::TEXT, ''),
      COALESCE(NEW.total_participants::TEXT, ''),
      auth.uid()
    );
  END IF;

  IF OLD.booking_amount IS DISTINCT FROM NEW.booking_amount THEN
    INSERT INTO public.booking_logs (booking_id, action, field_name, old_value, new_value, changed_by)
    VALUES (
      NEW.id,
      'updated',
      'booking_amount',
      COALESCE(OLD.booking_amount::TEXT, ''),
      COALESCE(NEW.booking_amount::TEXT, ''),
      auth.uid()
    );
  END IF;

  IF OLD.due_amount IS DISTINCT FROM NEW.due_amount THEN
    INSERT INTO public.booking_logs (booking_id, action, field_name, old_value, new_value, changed_by)
    VALUES (
      NEW.id,
      'updated',
      'due_amount',
      COALESCE(OLD.due_amount::TEXT, ''),
      COALESCE(NEW.due_amount::TEXT, ''),
      auth.uid()
    );
  END IF;

  IF OLD.type IS DISTINCT FROM NEW.type THEN
    INSERT INTO public.booking_logs (booking_id, action, field_name, old_value, new_value, changed_by, cancellation_note)
    VALUES (
      NEW.id,
      CASE 
        WHEN NEW.type = 'canceled' THEN 'canceled'
        WHEN OLD.type = 'canceled' AND NEW.type != 'canceled' THEN 'restored'
        ELSE 'updated'
      END,
      'type',
      COALESCE(OLD.type::TEXT, ''),
      COALESCE(NEW.type::TEXT, ''),
      auth.uid(),
      NEW.cancellation_note
    );
  END IF;

  IF OLD.admin_note IS DISTINCT FROM NEW.admin_note THEN
    INSERT INTO public.booking_logs (booking_id, action, field_name, old_value, new_value, changed_by)
    VALUES (
      NEW.id,
      'updated',
      'admin_note',
      COALESCE(OLD.admin_note::TEXT, ''),
      COALESCE(NEW.admin_note::TEXT, ''),
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to log booking changes
DROP TRIGGER IF EXISTS booking_changes_trigger ON public.bookings;
CREATE TRIGGER booking_changes_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (
    OLD.contact_person_name IS DISTINCT FROM NEW.contact_person_name OR
    OLD.contact_person_number IS DISTINCT FROM NEW.contact_person_number OR
    OLD.contact_person_email IS DISTINCT FROM NEW.contact_person_email OR
    OLD.total_participants IS DISTINCT FROM NEW.total_participants OR
    OLD.booking_amount IS DISTINCT FROM NEW.booking_amount OR
    OLD.due_amount IS DISTINCT FROM NEW.due_amount OR
    OLD.type IS DISTINCT FROM NEW.type OR
    OLD.admin_note IS DISTINCT FROM NEW.admin_note
  )
  EXECUTE FUNCTION log_booking_changes();
