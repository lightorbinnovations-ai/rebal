-- INSPECT SCHEMA SCRIPT
-- Run this to get a report of the current table structure and permissions

SELECT 
    t.table_schema, 
    t.table_name, 
    t.table_type,
    (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count,
    has_table_privilege('authenticated', t.table_schema || '.' || t.table_name, 'SELECT') as db_auth_select_permission,
    has_table_privilege('anon', t.table_schema || '.' || t.table_name, 'SELECT') as db_anon_select_permission
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
AND t.table_name IN ('user_roles', 'companies', 'domain_requests', 'domain_pricing');

-- Check RLS Policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename IN ('user_roles', 'companies');

-- Check specific column types for user_roles
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_roles';

-- Check if user exists (safe check)
SELECT id, email, role FROM auth.users WHERE email = 'rebalpros@gmail.com';
