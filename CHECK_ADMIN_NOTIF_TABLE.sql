-- Check if admin_notifications_log table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_notifications_log'
ORDER BY ordinal_position;
