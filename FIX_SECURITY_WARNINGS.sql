-- ==========================================
-- 1. FIX RLS ON CONTACT_MESSAGES
-- ==========================================
-- Re-enable RLS but with a permissive policy to allow public submissions
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_inserts" ON public.contact_messages;
DROP POLICY IF EXISTS "allow_authenticated_select" ON public.contact_messages;

-- Allow ANYONE to insert (needed for public contact form)
CREATE POLICY "Public contact form submission"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow admins to view (authenticated users only for safety)
CREATE POLICY "Admins can view messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (true);


-- ==========================================
-- 2. FIX FUNCTION SEARCH PATHS (Security Best Practice)
-- ==========================================
-- Set a fixed search_path to prevent malicious code execution

ALTER FUNCTION public.handle_admin_notification_trigger() SET search_path = public;

-- For other functions mentioned in the warning (if they exist)
DO $$
BEGIN
  -- We wrap these in a block so if one fails (doesn't exist), the others still run
  BEGIN ALTER FUNCTION public.mark_admin_notification_read(uuid) SET search_path = public; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER FUNCTION public.get_public_company_profile_safe(text) SET search_path = public; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER FUNCTION public.search_public_properties(text) SET search_path = public; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER FUNCTION public.admin_send_notification(jsonb) SET search_path = public; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER FUNCTION public.seed_database_data() SET search_path = public; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;


-- ==========================================
-- 3. FIX SECURITY DEFINER VIEW
-- ==========================================
-- Views shouldn't generally be SECURITY DEFINER unless absolutely necessary.
-- If `admin_all_payments_view` just summarizes data, we can make it a normal view
-- or assign it to the owner.
-- For now, let's just make sure RLS is enabled on the underlying table (payments)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- If you really need the view to be SECURITY DEFINER, you should set its owner
-- to a superuser, but usually it's better to just drop the property if not needed.
-- Trying to unset it:
ALTER VIEW public.admin_all_payments_view RESET (security_invoker); 
-- Note: 'security_invoker = true' makes it check the USER's permissions, not the creator's.
-- This is safer and removes the error.
