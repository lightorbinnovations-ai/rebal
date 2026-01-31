-- EMERGENCY FIX: Check if triggers are causing insert failures
-- Run this to see the actual error from the trigger

-- Test 1: Try inserting into contact_messages manually
INSERT INTO public.contact_messages (name, email, message, status)
VALUES ('Test User', 'test@example.com', 'Test message from SQL', 'new')
RETURNING *;

-- If the above fails, check the error message carefully
-- Common issues:
-- 1. Trigger function lacks permission to insert into admin_notifications_log
-- 2. Column mismatch (e.g., 'subject' doesn't exist on support_tickets)
-- 3. NULL constraint violations
