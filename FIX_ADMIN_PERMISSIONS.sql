-- Fix permissions for Admin Login
-- If the user sees "database error querying schema", it usually means:
-- 1. The 'authenticated' role (which logged-in users use) doesn't have permission to SELECT on the table.
-- 2. RLS is on but no policy allows access.

-- Grant access to user_roles
GRANT SELECT ON public.user_roles TO authenticated, service_role, anon;

-- Ensure RLS allows reading own role
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Also allow Super Admins to read ALL roles (for management)
DROP POLICY IF EXISTS "Super Admins can read all roles" ON public.user_roles;
CREATE POLICY "Super Admins can read all roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

-- Just to be safe for the login check specifically (sometimes it happens before full role load)
-- We can allow public read if roles aren't secret, OR keep it strict.
-- The error "database error querying schema" suggests the table might not be visible or accessible.

-- Also check companies table access
GRANT SELECT ON public.companies TO authenticated, service_role;
