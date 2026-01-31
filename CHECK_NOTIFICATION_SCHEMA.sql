-- Check the actual schema of admin_notifications_log
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'admin_notifications_log'
ORDER BY ordinal_position;
