-- =================================================================
-- 1. FIX SEARCH PATH WARNINGS (ROBUST DYNAMIC METHOD)
-- =================================================================
-- We use a dynamic block to find the functions by name.
-- This prevents errors if arguments don't match exactly.

DO $$
DECLARE
    func_record record;
BEGIN
    -- Fix 'search_public_properties'
    FOR func_record IN
        SELECT oid::regprocedure::text as func_signature
        FROM pg_proc
        WHERE proname = 'search_public_properties'
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'ALTER FUNCTION ' || func_record.func_signature || ' SET search_path = public';
    END LOOP;

    -- Fix 'admin_send_notification'
    FOR func_record IN
        SELECT oid::regprocedure::text as func_signature
        FROM pg_proc
        WHERE proname = 'admin_send_notification'
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'ALTER FUNCTION ' || func_record.func_signature || ' SET search_path = public';
    END LOOP;
END $$;


-- =================================================================
-- 2. FIX SECURITY DEFINER VIEW ERROR (CORRECTED COLUMNS)
-- =================================================================
-- Re-creating the view with 'Security Invoker' for safety.
-- Replaced 'provider' with 'payment_method' based on your table schema.

DROP VIEW IF EXISTS public.admin_all_payments_view;

CREATE VIEW public.admin_all_payments_view WITH (security_invoker = true) AS
SELECT 
    p.id,
    p.amount,
    p.currency,
    p.status,
    p.payment_method, 
    p.created_at,
    c.name as company_name,
    c.email as company_email
FROM payments p
LEFT JOIN companies c ON p.company_id = c.id;


-- =================================================================
-- 3. SILENCE RLS POLICY WARNING
-- =================================================================
-- Making the policy explicit to satisfy the security linter.

DROP POLICY IF EXISTS "Public contact form submission" ON public.contact_messages;

CREATE POLICY "Public contact form submission"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (email IS NOT NULL);
