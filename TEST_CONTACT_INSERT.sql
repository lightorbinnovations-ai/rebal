-- DIRECT TRIGGER TEST
-- This will show us the EXACT error message

-- Test 1: Try to insert into contact_messages and see what the trigger does
BEGIN;

INSERT INTO public.contact_messages (name, email, message, status)
VALUES ('SQL Test User', 'sqltest@example.com', 'This is a test message from SQL', 'new');

-- If this fails, the error message will tell us exactly what's wrong
-- If it succeeds, check if notification was created:
SELECT * FROM public.admin_notifications_log ORDER BY created_at DESC LIMIT 1;

ROLLBACK; -- Don't actually save the test data
