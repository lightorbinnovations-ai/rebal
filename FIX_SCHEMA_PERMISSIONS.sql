-- FIX SCHEMA PERMISSIONS
-- The error "Database error querying schema" might mean the user cannot access the 'public' schema itself.

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Also try to refresh the schema cache by notifying pgrst
NOTIFY pgrst, 'reload config';
