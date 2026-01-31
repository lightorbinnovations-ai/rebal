-- Create rate limits tracking table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP address or session ID
  endpoint text NOT NULL, -- 'inquiries' or 'analytics'
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS rate_limits_lookup_idx 
ON public.rate_limits (identifier, endpoint, window_start);

-- Auto-cleanup old rate limit records (older than 1 hour)
CREATE INDEX IF NOT EXISTS rate_limits_cleanup_idx 
ON public.rate_limits (window_start);

-- RLS: Only service role can manage rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_window_start timestamptz;
  v_current_count integer;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;
  
  -- Clean up old records for this identifier
  DELETE FROM rate_limits 
  WHERE identifier = p_identifier 
    AND endpoint = p_endpoint 
    AND window_start < v_window_start;
  
  -- Get current count in window
  SELECT COALESCE(SUM(request_count), 0) INTO v_current_count
  FROM rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;
  
  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Record this request
  INSERT INTO rate_limits (identifier, endpoint, window_start)
  VALUES (p_identifier, p_endpoint, now());
  
  RETURN true;
END;
$$;