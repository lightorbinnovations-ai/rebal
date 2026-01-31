-- FIX ADMIN ACCESS (Recursion & Privileges)

-- 1. Create a secure function to check admin status (bypassing RLS)
-- This avoids the "Infinite Recursion" problem in RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER -- Runs with db owner permissions, bypassing RLS
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
$$;

-- 2. Fix user_roles policy to be SIMPLE and NON-RECURSIVE
-- Users can ALWAYS see their OWN role. That's all that is needed for AdminLogin.
DROP POLICY IF EXISTS "Allow admins to read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;

CREATE POLICY "Users can read own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- 3. Fix other tables to use the secure function instead of direct query
-- This is much cleaner and safer

-- Companies
DROP POLICY IF EXISTS "Enable read access for admins" ON public.companies;
CREATE POLICY "Enable read access for admins"
ON public.companies FOR SELECT
TO authenticated
USING (
  is_admin() OR user_id = auth.uid()
);

-- Properties
DROP POLICY IF EXISTS "Enable read access for admins" ON public.properties;
CREATE POLICY "Enable read access for admins"
ON public.properties FOR SELECT
TO authenticated
USING (
  is_admin() OR company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
);

-- Inquiries
DROP POLICY IF EXISTS "Enable read access for admins" ON public.inquiries;
CREATE POLICY "Enable read access for admins"
ON public.inquiries FOR SELECT
TO authenticated
USING (
  is_admin() OR company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
);

-- Payments
DROP POLICY IF EXISTS "Enable read access for admins" ON public.payments;
CREATE POLICY "Enable read access for admins"
ON public.payments FOR SELECT
TO authenticated
USING (
  is_admin() OR company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
);

-- 4. EMERGENCY: Grant super_admin to the current user (if running this in SQL Editor)
-- Note: You need to replace 'YOUR_EMAIL' manually or just rely on auth.uid() if running in context
-- But since we can't know the email here, we ensure the logic above works.
