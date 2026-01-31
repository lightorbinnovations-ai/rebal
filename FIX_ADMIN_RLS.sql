-- FIX ADMIN RLS POLICIES
-- This script ensures that the super_admin has access to critical tables for the dashboard

-- 1. Ensure user_roles is readable by admins (CRITICAL for useAdminAuth)
DROP POLICY IF EXISTS "Allow admins to read user_roles" ON public.user_roles;
CREATE POLICY "Allow admins to read user_roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (
    -- User can see their own role OR if they are a super_admin
    user_id = auth.uid() 
    OR 
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- 2. Ensure companies table is readable by admins
DROP POLICY IF EXISTS "Enable read access for admins" ON public.companies;
CREATE POLICY "Enable read access for admins"
ON public.companies FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
    OR user_id = auth.uid() -- fallback for owners
);

-- 3. Ensure properties table is readable by admins
DROP POLICY IF EXISTS "Enable read access for admins" ON public.properties;
CREATE POLICY "Enable read access for admins"
ON public.properties FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
    OR company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()) -- fallback for owners
);

-- 4. Ensure inquiries table is readable by admins
DROP POLICY IF EXISTS "Enable read access for admins" ON public.inquiries;
CREATE POLICY "Enable read access for admins"
ON public.inquiries FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
    OR company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
);

-- 5. Ensure referrals table is readable by admins
DROP POLICY IF EXISTS "Enable read access for admins" ON public.referrals;
CREATE POLICY "Enable read access for admins"
ON public.referrals FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
    OR referrer_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
);

-- 6. Ensure payments table is readable by admins
DROP POLICY IF EXISTS "Enable read access for admins" ON public.payments;
CREATE POLICY "Enable read access for admins"
ON public.payments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
    OR company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
);
