-- =====================================================
-- SECURITY HARDENING MIGRATION
-- Move extensions out of public schema + strengthen RLS
-- =====================================================

-- 1. Create extensions schema and move extensions
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Note: The extension might already exist, so we'll just ensure future extensions go to extensions schema
-- The "encode" function used in custom_domains.verification_token is from the pgcrypto extension

-- 2. Ensure super admin policies are working correctly for all admin tables
-- Already well-configured, but add explicit deny for anon on sensitive tables

-- 3. Add explicit DENY for anonymous users on lead_tracking table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'lead_tracking' 
    AND policyname = 'Deny anonymous SELECT on lead_tracking'
  ) THEN
    CREATE POLICY "Deny anonymous SELECT on lead_tracking"
    ON public.lead_tracking
    FOR SELECT
    TO anon
    USING (false);
  END IF;
END $$;

-- 4. Add explicit DENY for anonymous users on analytics table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'analytics' 
    AND policyname = 'Deny anonymous SELECT on analytics'
  ) THEN
    CREATE POLICY "Deny anonymous SELECT on analytics"
    ON public.analytics
    FOR SELECT
    TO anon
    USING (false);
  END IF;
END $$;

-- 5. Add explicit DENY for anonymous users on referral_commissions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'referral_commissions' 
    AND policyname = 'Deny anonymous SELECT on referral_commissions'
  ) THEN
    CREATE POLICY "Deny anonymous SELECT on referral_commissions"
    ON public.referral_commissions
    FOR SELECT
    TO anon
    USING (false);
  END IF;
END $$;

-- 6. Add explicit DENY for anonymous users on subscriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subscriptions' 
    AND policyname = 'Deny anonymous SELECT on subscriptions'
  ) THEN
    CREATE POLICY "Deny anonymous SELECT on subscriptions"
    ON public.subscriptions
    FOR SELECT
    TO anon
    USING (false);
  END IF;
END $$;

-- 7. Add explicit DENY for anonymous users on withdrawal_requests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'withdrawal_requests' 
    AND policyname = 'Deny anonymous SELECT on withdrawal_requests'
  ) THEN
    CREATE POLICY "Deny anonymous SELECT on withdrawal_requests"
    ON public.withdrawal_requests
    FOR SELECT
    TO anon
    USING (false);
  END IF;
END $$;

-- 8. Add explicit DENY for anonymous users on notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND policyname = 'Deny anonymous SELECT on notifications'
  ) THEN
    CREATE POLICY "Deny anonymous SELECT on notifications"
    ON public.notifications
    FOR SELECT
    TO anon
    USING (false);
  END IF;
END $$;

-- 9. Add explicit DENY for anonymous users on support_tickets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'support_tickets' 
    AND policyname = 'Deny anonymous SELECT on support_tickets'
  ) THEN
    CREATE POLICY "Deny anonymous SELECT on support_tickets"
    ON public.support_tickets
    FOR SELECT
    TO anon
    USING (false);
  END IF;
END $$;

-- 10. Add explicit DENY for anonymous users on verification_requests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'verification_requests' 
    AND policyname = 'Deny anonymous SELECT on verification_requests'
  ) THEN
    CREATE POLICY "Deny anonymous SELECT on verification_requests"
    ON public.verification_requests
    FOR SELECT
    TO anon
    USING (false);
  END IF;
END $$;

-- 11. Add explicit DENY for anonymous users on email_reverification_tokens table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'email_reverification_tokens' 
    AND policyname = 'Deny anonymous SELECT on email_reverification_tokens'
  ) THEN
    CREATE POLICY "Deny anonymous SELECT on email_reverification_tokens"
    ON public.email_reverification_tokens
    FOR SELECT
    TO anon
    USING (false);
  END IF;
END $$;

-- 12. Add explicit DENY for anonymous users on referrals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'referrals' 
    AND policyname = 'Deny anonymous SELECT on referrals'
  ) THEN
    CREATE POLICY "Deny anonymous SELECT on referrals"
    ON public.referrals
    FOR SELECT
    TO anon
    USING (false);
  END IF;
END $$;

-- 13. Add explicit DENY for anonymous users on user_roles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles' 
    AND policyname = 'Deny anonymous access to user_roles'
  ) THEN
    CREATE POLICY "Deny anonymous access to user_roles"
    ON public.user_roles
    FOR ALL
    TO anon
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;

-- 14. Add explicit DENY for anonymous users on custom_domains table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'custom_domains' 
    AND policyname = 'Deny anonymous access to custom_domains'
  ) THEN
    CREATE POLICY "Deny anonymous access to custom_domains"
    ON public.custom_domains
    FOR ALL
    TO anon
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;

-- 15. Super admin SELECT policy for payments already exists, but ensure they can manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payments' 
    AND policyname = 'Super admins can manage payments'
  ) THEN
    CREATE POLICY "Super admins can manage payments"
    ON public.payments
    FOR ALL
    USING (has_role(auth.uid(), 'super_admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END $$;

-- 16. Add rate limit cleanup function to prevent table bloat
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE window_start < now() - interval '1 hour';
END;
$$;

-- 17. Create an index on companies.user_id for faster RLS checks
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);

-- 18. Create an index on companies.slug for faster public lookups
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);

-- 19. Create an index on properties.company_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_company_id ON public.properties(company_id);

-- 20. Create an index on inquiries.company_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_inquiries_company_id ON public.inquiries(company_id);