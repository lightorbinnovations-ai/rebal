-- FIX NOTIFICATIONS RLS
-- Enables admin access to property_boosts and domain_requests tables
-- causing "Failed to load notifications" errors.

-- 1. Helper function (ensure it exists and is secure)
-- We rely on the fix from FIX_RLS_RECURSION.sql where is_admin() is owned by postgres.

-- 2. Property Boosts Policies
ALTER TABLE public.property_boosts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage boosts" ON public.property_boosts;
CREATE POLICY "Admins can manage boosts"
  ON public.property_boosts
  FOR ALL
  TO authenticated
  USING ( is_admin() );

-- 3. Domain Requests Policies
ALTER TABLE public.domain_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage domain requests" ON public.domain_requests;
CREATE POLICY "Admins can manage domain requests"
  ON public.domain_requests
  FOR ALL
  TO authenticated
  USING ( is_admin() );

-- 4. Custom Domains Policies
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage custom domains" ON public.custom_domains;
CREATE POLICY "Admins can manage custom domains"
  ON public.custom_domains
  FOR ALL
  TO authenticated
  USING ( is_admin() );

-- 5. Grant Permissions
GRANT ALL ON public.property_boosts TO authenticated;
GRANT ALL ON public.domain_requests TO authenticated;
GRANT ALL ON public.custom_domains TO authenticated;
