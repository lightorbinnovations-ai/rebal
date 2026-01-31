-- Fix the Security Definer View issue by recreating the view with security_invoker
DROP VIEW IF EXISTS public.custom_domains_safe;

CREATE VIEW public.custom_domains_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  company_id,
  domain,
  status,
  verified_at,
  created_at,
  updated_at
  -- verification_token is intentionally excluded for security
FROM public.custom_domains;

-- Grant access to the view
GRANT SELECT ON public.custom_domains_safe TO authenticated;