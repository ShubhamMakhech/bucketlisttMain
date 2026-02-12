-- RLS: Allow users with role 'marketing' to view all bookings (read-only).
-- Marketing can see every row in public.bookings; they cannot insert, update, or delete.
--
-- If user_roles.role uses the app_role enum, ensure 'marketing' is allowed:
--   ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing';  -- PostgreSQL 15+
--   or: ALTER TYPE public.app_role ADD VALUE 'marketing';             -- if not already present

CREATE POLICY "Marketing can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role::text = 'marketing'
  )
);
