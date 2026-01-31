-- CREATE UNIFIED PAYMENTS VIEW
-- Aggregates data from payments, property_boosts, and domain_requests
-- for unified admin reporting.

-- 1. Ensure dependent tables are secure (Handled by FIX_NOTIFICATIONS_RLS.sql)

-- 2. Create the View
CREATE OR REPLACE VIEW public.admin_all_payments_view AS
SELECT 
    p.id,
    p.paystack_reference as reference,
    p.amount, -- Already in Kobo (INTEGER)
    p.status,
    COALESCE(p.payment_method, 'paystack') as payment_method,
    p.created_at,
    p.company_id,
    c.name as company_name,
    'subscription' as type,
    p.metadata
FROM payments p
LEFT JOIN companies c ON p.company_id = c.id

UNION ALL

SELECT
    pb.id,
    'BOOST-' || substring(pb.id::text, 1, 8) as reference,
    pb.amount_paid as amount, -- Presumed Kobo (INTEGER)
    -- Map boost statuses to standard payment statuses
    CASE 
        WHEN pb.status IN ('active', 'expired') THEN 'success' 
        WHEN pb.status = 'pending' THEN 'pending'
        WHEN pb.status = 'cancelled' THEN 'failed'
        ELSE pb.status 
    END as status,
    'paystack' as payment_method,
    pb.created_at,
    pb.company_id,
    c.name as company_name,
    'boost' as type,
    jsonb_build_object('boost_type', pb.boost_type) as metadata
FROM property_boosts pb
LEFT JOIN companies c ON pb.company_id = c.id
WHERE pb.amount_paid > 0

UNION ALL

SELECT
    dr.id,
    'DOMAIN-' || substring(dr.id::text, 1, 8) as reference,
    (dr.total_price * 100)::integer as amount, -- Convert Naira (NUMERIC) to Kobo (INTEGER)
    -- Map domain statuses to standard payment statuses
    CASE 
        WHEN dr.status IN ('paid', 'processing', 'active') THEN 'success' 
        WHEN dr.status IN ('pending', 'pending_payment') THEN 'pending'
        WHEN dr.status IN ('rejected', 'cancelled') THEN 'failed'
        ELSE dr.status 
    END as status,
    'paystack' as payment_method,
    dr.created_at,
    dr.company_id,
    c.name as company_name,
    'domain' as type,
    jsonb_build_object('domain', dr.selected_domain, 'extension', dr.selected_extension) as metadata
FROM domain_requests dr
LEFT JOIN companies c ON dr.company_id = c.id
WHERE dr.total_price > 0;

-- 3. Security
-- Allow implicit RLS from underlying tables (preferred for views)
ALTER VIEW public.admin_all_payments_view OWNER TO postgres;

-- 4. Grant Access
GRANT SELECT ON public.admin_all_payments_view TO authenticated;
