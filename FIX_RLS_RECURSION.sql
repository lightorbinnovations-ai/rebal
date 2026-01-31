-- FIX RLS INFINITE RECURSION ON USER_ROLES
-- The 500 error is caused by policies on 'user_roles' calling 'is_admin()', 
-- which in turn queries 'user_roles', triggering the policy again.

-- 1. Disable RLS temporarily to immediately stop the loops
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Drop all conflicting policies on user_roles
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Deny anonymous access to user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- 3. Ensure 'is_admin' bypasses RLS
-- By setting the owner to postgres (superuser), the SECURITY DEFINER function
-- will bypass RLS checks when it runs, preventing recursion.
ALTER FUNCTION public.is_admin() OWNER TO postgres;

-- 4. Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Create a SAFE, Non-Recursive Policy
-- This allows users (and is_admin function) to check their OWN role.
-- Since is_admin() queries WHERE user_id = auth.uid(), this policy satisfies it
-- without needing to call is_admin() itself (which would loop).
CREATE POLICY "Users can read own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING ( user_id = auth.uid() );

-- 6. Allow Admins to View/Manage All Roles (Recursion Safe)
-- We use a check that does NOT rely on querying user_roles via RLS context if possible,
-- OR we trust that `is_admin()` now bypasses RLS due to step 3.
-- To be absolutely safe, we will rely on step 3's fix.
CREATE POLICY "Super Admins can manage all roles"
ON public.user_roles
TO authenticated
USING ( is_admin() );

-- 7. Grant access to authenticated users
GRANT SELECT ON public.user_roles TO authenticated;
