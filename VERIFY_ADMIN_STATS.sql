-- VERIFICATION SCRIPT FOR ADMIN DASHBOARD METRICS
-- Run this in your Supabase SQL Editor to get the source of truth for all your admin data.

-- ============================================================================
-- 1. DASHBOARD OVERVIEW COUNTS
-- ============================================================================
SELECT '--- 1. DASHBOARD TOTALS ---' as Category, '-------------------' as Metric, '-------------------' as Value
UNION ALL
SELECT 'Overview', 'Total Users (Companies)', COUNT(*)::text FROM companies
UNION ALL
SELECT 'Overview', 'Total Properties', COUNT(*)::text FROM properties
UNION ALL
SELECT 'Overview', 'Total Inquiries', COUNT(*)::text FROM inquiries
UNION ALL
SELECT 'Overview', 'Total Referrals', COUNT(*)::text FROM referrals
UNION ALL
-- Payments are stored in kobo, divide by 100 for Naira
SELECT 'Overview', 'Total Revenue (NGN)', (COALESCE(SUM(amount), 0)::numeric / 100)::text 
FROM payments 
WHERE status = 'success';


-- ============================================================================
-- 2. SUBSCRIPTION METRICS (MRR, Churn, etc)
-- ============================================================================
SELECT ' ' as Category, ' ' as Metric, ' ' as Value
UNION ALL
SELECT '--- 2. SUBSCRIPTION METRICS ---', '-------------------', '-------------------'
UNION ALL
SELECT 'Subscriptions', 'Active Subscribers', COUNT(*)::text 
FROM subscriptions 
WHERE status = 'active'
UNION ALL
SELECT 'Subscriptions', 'Trial Users', COUNT(*)::text 
FROM subscriptions 
WHERE status = 'trialing'
UNION ALL
SELECT 'Subscriptions', 'Past Due', COUNT(*)::text 
FROM subscriptions 
WHERE status = 'past_due'
UNION ALL
-- MRR Calculation: 
-- 1. Filter for active subscriptions
-- 2. If Yearly: yearly_price / 12
-- 3. If Monthly: monthly_price
-- 4. Sum correctly and divide by 100 (Kobo -> Naira)
SELECT 'Subscriptions', 'Calculated MRR (NGN)', 
    COALESCE(
        (SELECT SUM(
            CASE 
                WHEN s.billing_interval = 'yearly' THEN sp.yearly_price::numeric / 12
                ELSE sp.monthly_price::numeric
            END
        ) 
        FROM subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        WHERE s.status = 'active')
    ::numeric / 100, 0)::text
UNION ALL
-- Failed Payments (Strictly 'failed', ignoring 'pending')
SELECT 'Subscriptions', 'Failed Payments Count', COUNT(*)::text 
FROM payments 
WHERE status = 'failed'
UNION ALL
SELECT 'Subscriptions', 'Failed Payments Amount (NGN)', (COALESCE(SUM(amount), 0)::numeric / 100)::text 
FROM payments 
WHERE status = 'failed';


-- ============================================================================
-- 3. PAYMENT STATS
-- ============================================================================
-- Used in AdminPayments page
SELECT ' ' as Category, ' ' as Metric, ' ' as Value
UNION ALL
SELECT '--- 3. PAYMENT PAGE STATS ---', '-------------------', '-------------------'
UNION ALL
SELECT 'Payments', 'Total Successful Count', COUNT(*)::text 
FROM payments 
WHERE status = 'success'
UNION ALL
SELECT 'Payments', 'Revenue This Month (NGN)', 
    (COALESCE(SUM(amount), 0)::numeric / 100)::text 
FROM payments 
WHERE status = 'success' 
AND created_at >= date_trunc('month', now());


-- ============================================================================
-- 4. REFERRALS & WITHDRAWALS
-- ============================================================================
-- Rewards and Withdrawals are stored in Naira by default (no /100 division needed for these tables)
SELECT ' ' as Category, ' ' as Metric, ' ' as Value
UNION ALL
SELECT '--- 4. REFERRALS & WITHDRAWALS ---', '-------------------', '-------------------'
UNION ALL
SELECT 'Referrals', 'Total Earnings (NGN)', COALESCE(SUM(reward_amount), 0)::text 
FROM referrals
UNION ALL
SELECT 'Referrals', 'Total Paid Out (NGN)', COALESCE(SUM(reward_amount), 0)::text 
FROM referrals 
WHERE status = 'paid'
UNION ALL
SELECT 'Withdrawals', 'Pending Requests', COUNT(*)::text 
FROM withdrawal_requests 
WHERE status = 'pending'
UNION ALL
SELECT 'Withdrawals', 'Pending Amount (NGN)', COALESCE(SUM(amount), 0)::text 
FROM withdrawal_requests 
WHERE status = 'pending';


-- ============================================================================
-- 5. DOMAINS & OTHER REQUESTS
-- ============================================================================
SELECT ' ' as Category, ' ' as Metric, ' ' as Value
UNION ALL
SELECT '--- 5. DOMAINS & SUPPORT ---', '-------------------', '-------------------'
UNION ALL
SELECT 'Domains', 'Total Requests', COUNT(*)::text FROM domain_requests
UNION ALL
SELECT 'Domains', 'Pending Requests', COUNT(*)::text FROM domain_requests WHERE status = 'pending'
UNION ALL
SELECT 'Domains', 'Active Domains', COUNT(*)::text FROM custom_domains
UNION ALL
SELECT 'Support', 'Total Tickets', COUNT(*)::text FROM support_tickets
UNION ALL
SELECT 'Support', 'Open Tickets', COUNT(*)::text FROM support_tickets WHERE status != 'resolved' AND status != 'closed'
UNION ALL
SELECT 'Verifications', 'Pending Requests', COUNT(*)::text FROM verification_requests WHERE status = 'pending'
UNION ALL
SELECT 'Notifications', 'Total System Events', COUNT(*)::text FROM notifications;
