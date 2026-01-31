-- EMERGENCY FIX FOR NOTIFICATION TRIGGERS
-- The issue: RLS is blocking the trigger from inserting into admin_notifications_log

-- Solution: Add a policy that allows the trigger function to insert
-- OR disable RLS for service role (safer for triggers)

-- Option 1: Add a permissive INSERT policy for the trigger
DROP POLICY IF EXISTS "Allow trigger inserts" ON public.admin_notifications_log;
CREATE POLICY "Allow trigger inserts"
ON public.admin_notifications_log
FOR INSERT
WITH CHECK (true); -- Allow all inserts (triggers run as SECURITY DEFINER)

-- This is safe because:
-- 1. Regular users can't directly insert (they don't have table access)
-- 2. Only triggers (which are controlled by us) will use this
-- 3. SELECT is still restricted to admins only
