-- CREATE NEW USER MANUALLY (Bypasses Rate Limits)
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  -- CHANGE THESE VALUES --
  new_email TEXT := 'YOUR_NEW_EMAIL@example.com';
  new_password TEXT := 'YOUR_NEW_PASSWORD';
  is_admin BOOLEAN := FALSE; -- Set to TRUE if you want admin access
  -------------------------
  
  new_user_id UUID;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    new_email,
    crypt(new_password, gen_salt('bf')),
    now(), -- Auto-confirm email
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Create public profile immediately (if your app relies on triggers that might fail)
  -- This ensures data consistency even if triggers are disabled
  INSERT INTO public.companies (
    user_id, 
    name, 
    slug, 
    email
  ) VALUES (
    new_user_id,
    'My New Company',
    lower(regexp_replace(new_email, '[^a-zA-Z0-9]', '-', 'g')),
    new_email
  ) ON CONFLICT DO NOTHING;

  -- Grant admin role if requested
  IF is_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'super_admin');
  END IF;

  RAISE NOTICE 'User created successfully! ID: %', new_user_id;
END $$;
