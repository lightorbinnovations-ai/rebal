-- Enable RLS on analytics if not already enabled
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to insert analytics events
-- This is safe because they can only insert, not read or update other people's data
-- (Reading is restricted to admins via other policies if needed, or we add a policy just for admins)

DROP POLICY IF EXISTS "Public can insert analytics" ON public.analytics;

CREATE POLICY "Public can insert analytics"
ON public.analytics
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow admins to read analytics (Active User in Admin Dashboard)
-- Using the same logic as other admin tables
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics;

CREATE POLICY "Admins can view all analytics"
ON public.analytics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role::text IN ('super_admin', 'moderator', 'admin')
  )
);
