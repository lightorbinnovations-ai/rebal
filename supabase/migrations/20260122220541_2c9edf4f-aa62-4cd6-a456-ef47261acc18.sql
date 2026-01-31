-- Fix overly permissive lead_tracking UPDATE policy
DROP POLICY IF EXISTS "Users can update their own session tracking" ON public.lead_tracking;

-- Create a more restrictive UPDATE policy that validates company exists
CREATE POLICY "Users can update their session tracking"
ON public.lead_tracking
FOR UPDATE
USING (
  -- Only allow updates for valid companies
  EXISTS (SELECT 1 FROM public.companies WHERE id = lead_tracking.company_id)
)
WITH CHECK (
  -- Validate company exists and values are reasonable
  EXISTS (SELECT 1 FROM public.companies WHERE id = lead_tracking.company_id)
  AND time_spent_seconds >= 0
  AND page_views >= 0
);

-- Add validation trigger to prevent unrealistic updates
CREATE OR REPLACE FUNCTION public.validate_tracking_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent unrealistic time updates (max 24 hours per update = 86400 seconds)
  IF NEW.time_spent_seconds - COALESCE(OLD.time_spent_seconds, 0) > 86400 THEN
    RAISE EXCEPTION 'Invalid time update: exceeds maximum allowed increment';
  END IF;
  
  -- Prevent negative values
  IF NEW.time_spent_seconds < 0 OR NEW.page_views < 0 THEN
    RAISE EXCEPTION 'Negative values not allowed for tracking metrics';
  END IF;
  
  -- Prevent unrealistic page view jumps (max 100 pages per update)
  IF NEW.page_views - COALESCE(OLD.page_views, 0) > 100 THEN
    RAISE EXCEPTION 'Invalid page views update: exceeds maximum allowed increment';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_tracking_updates ON public.lead_tracking;
CREATE TRIGGER validate_tracking_updates
BEFORE UPDATE ON public.lead_tracking
FOR EACH ROW EXECUTE FUNCTION public.validate_tracking_update();

-- Add explicit deny policy for anonymous access to payments table (defense in depth)
-- Note: RLS already defaults to deny, but explicit is better for security audits
DO $$
BEGIN
  -- Check if the policy exists before trying to create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payments' 
    AND policyname = 'Deny anonymous access to payments'
  ) THEN
    CREATE POLICY "Deny anonymous access to payments"
    ON public.payments
    FOR SELECT
    TO anon
    USING (false);
  END IF;
END $$;