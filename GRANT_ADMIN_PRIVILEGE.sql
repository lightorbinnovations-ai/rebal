-- GRANT ADMIN PRIVILEGES TO USER
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  target_user_id UUID := '1fe63d34-9f93-41b9-ad31-9bd58c694294';
BEGIN
  -- 1. Assign super_admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 2. Ensure company record exists (using IF check instead of ON CONFLICT)
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE user_id = target_user_id) THEN
    INSERT INTO public.companies (user_id, name, slug, email)
    VALUES (
      target_user_id, 
      'Rebal Admin', 
      'rebal-admin-' || substring(target_user_id::text from 1 for 8),
      'rebalpros@gmail.com'
    );
  ELSE
    UPDATE public.companies SET email = 'rebalpros@gmail.com' WHERE user_id = target_user_id;
  END IF;

  RAISE NOTICE 'Admin privileges granted to %', target_user_id;
END $$;
