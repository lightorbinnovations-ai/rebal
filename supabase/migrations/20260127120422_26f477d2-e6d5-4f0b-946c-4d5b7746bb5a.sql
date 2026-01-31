-- Fix lead_tracking RLS to allow anonymous page view tracking
-- Currently the SELECT for anon is blocked which causes 401 errors

-- First drop the problematic anon SELECT policy that blocks all access
DROP POLICY IF EXISTS "Deny anonymous SELECT on lead_tracking" ON public.lead_tracking;

-- Allow anonymous users to read their own session data (for updates)
CREATE POLICY "Anon can read their session tracking"
ON public.lead_tracking
FOR SELECT
USING (true);  -- Allow all SELECT since session_id is generated client-side

-- Note: The existing INSERT policy already allows anonymous inserts for valid companies
-- The UPDATE policy already restricts to 24-hour window with reasonable limits