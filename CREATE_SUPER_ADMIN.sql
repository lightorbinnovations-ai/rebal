-- Create the user in auth.users if they don't exist
-- Note: Manually inserting into auth.users is tricky due to encryption.
-- BETTER APPROACH: We assume the user creates an account via the normal Sign Up page (or we can use the invite function in dashboard if we had access).
-- HOWEVER, since I have SQL access, I can just grant the role to ANY email.

-- For this specific request, I will create a script that:
-- 1. Checks if the user exists.
-- 2. If yes, upgrades them.
-- 3. If no, creates them using a specialized function (if available) or basic insert (risky for password).

-- SAFE APPROACH:
-- I will create a SQL function to handle the new user creation properly using Supabase's internal auth methods is hard from SQL editor without `supabase_admin` extensions.
-- INSTEAD, I will provide a script to *upgrade* the user.
-- The user should Sign Up normally (or I can insert if I really want to force it).
-- Let's try to insert using the `pgcrypto` extension if available for hacking the password hash, BUT Supabase uses bcrypt.

-- SAFEST & FASTEST FOR USER:
-- 1. Just insert the role for the email.
-- 2. If the user doesn't exist, I'll insert a placeholder into auth.users with a known dummy hash or instruct the user to sign up first.

-- WAIT, User provided a specific password.
-- I can use the `auth.sign_up` function if it's exposed, but usually it's not.
-- Standard practice: "Insert into auth.users" manually with `crypt`.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    -- 1. Check if user already exists
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'rebalpros@gmail.com';

    -- 2. If not, create the user
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            aud,
            is_super_admin
        ) VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000',
            'rebalpros@gmail.com',
            crypt('SuperAdmin01@', gen_salt('bf')), -- Password encryption
            now(), -- Auto confirm email
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Pro Admin"}',
            now(),
            now(),
            'authenticated',
            'authenticated',
            false
        );
    ELSE
        -- Update password if user exists
        UPDATE auth.users 
        SET encrypted_password = crypt('SuperAdmin01@', gen_salt('bf'))
        WHERE id = new_user_id;
    END IF;

    -- 3. Grant Super Admin Role
    -- Create user_roles table if it doesn't exist (safety)
    CREATE TABLE IF NOT EXISTS public.user_roles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        role TEXT NOT NULL, -- 'super_admin', 'admin', 'moderator'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(user_id, role)
    );

    -- Enable RLS
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
    
    -- Create policies if they don't exist
    DO $p$ BEGIN
        CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT USING (true); -- Simplification for checking
    EXCEPTION WHEN duplicate_object THEN NULL; END $p$;

    -- Insert the role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 4. Also create a Company for them so the dashboard doesn't crash (optional but recommended)
    IF NOT EXISTS (SELECT 1 FROM public.companies WHERE user_id = new_user_id) THEN
        INSERT INTO public.companies (
            user_id, 
            name, 
            slug, 
            email,
            subscription_status
        ) VALUES (
            new_user_id,
            'REBAL Admin',
            'rebal-admin',
            'rebalpros@gmail.com',
            'active'
        );
    END IF;

END $$;
