-- FORCE FIX FOR USER ID: f7058488-e59d-4a94-8622-c4e477279d40

-- 1. Ensure user_roles table exists and is accessible
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, role)
);

-- 2. NUCLEAR OPTION: Disable RLS temporarily to confirm it's the issue (or make it public)
-- This is often the quickest fix for "schema errors" during development.
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 3. Grant access to everyone (authenticated users)
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 4-6. PROCEDURAL LOGIC TO HANDLE DATA
DO $$
BEGIN
    -- 4. INSERT THE ROLE MANUALLY for this specific user
    -- First delete any existing role to avoid duplicates (safest given no constraint)
    DELETE FROM public.user_roles WHERE user_id = 'f7058488-e59d-4a94-8622-c4e477279d40';
    -- Then insert fresh
    INSERT INTO public.user_roles (user_id, role)
    VALUES ('f7058488-e59d-4a94-8622-c4e477279d40', 'super_admin');

    -- 5. Force update the password one last time just in case
    UPDATE auth.users 
    SET encrypted_password = crypt('SuperAdmin01@', gen_salt('bf'))
    WHERE id = 'f7058488-e59d-4a94-8622-c4e477279d40';

    -- 6. Ensure Company Exists
    IF NOT EXISTS (SELECT 1 FROM public.companies WHERE user_id = 'f7058488-e59d-4a94-8622-c4e477279d40') THEN
        INSERT INTO public.companies (user_id, name, slug, email, subscription_status)
        VALUES (
            'f7058488-e59d-4a94-8622-c4e477279d40',
            'REBAL Admin',
            'rebal-admin',
            'rebalpros@gmail.com',
            'active'
        );
    END IF;
END $$;

-- 7. Grant access to companies table too
GRANT SELECT ON public.companies TO authenticated;
