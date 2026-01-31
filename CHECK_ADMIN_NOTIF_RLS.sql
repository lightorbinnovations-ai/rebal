-- Check RLS policies on admin_notifications_log
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'admin_notifications_log';
