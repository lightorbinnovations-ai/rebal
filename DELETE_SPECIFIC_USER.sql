-- DELETE SPECIFIC USER AND RELATED DATA
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  target_user_id UUID := 'b0f5ba39-5eec-48da-8ad4-cb1113715138'; -- The UUID you provided
BEGIN
  -- 1. Delete from public tables first (to avoid foreign key constraint errors)
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.companies WHERE user_id = target_user_id;
  
  -- 2. Delete from auth.users (this is the main user record)
  DELETE FROM auth.users WHERE id = target_user_id;

  RAISE NOTICE 'User % has been deleted.', target_user_id;
END $$;
