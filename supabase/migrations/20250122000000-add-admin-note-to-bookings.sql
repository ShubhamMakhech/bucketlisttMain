-- Add admin_note field to bookings table
-- This field is only accessible and editable by admins

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- Add comment to document the field
COMMENT ON COLUMN public.bookings.admin_note IS 'Admin-only notes for internal use. Only visible and editable by administrators.';

-- Ensure admins can update admin_note field
-- Note: This assumes you have a user_roles table with role='admin'
-- If your admin check is different, adjust the policy accordingly
DO $$
BEGIN
  -- Check if policy already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'bookings' 
    AND policyname = 'Admins can update admin_note'
  ) THEN
    -- Create policy for admins to update admin_note
    CREATE POLICY "Admins can update admin_note"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )
    );
  END IF;
END $$;

