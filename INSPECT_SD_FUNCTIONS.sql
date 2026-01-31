-- CHECK FOR RECURSIVE FUNCTIONS OR BAD DEFINERS
SELECT 
    p.proname as function_name,
    n.nspname as schema_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosecdef = true -- Security Definer
AND (
    pg_get_functiondef(p.oid) LIKE '%auth.users%' 
    OR pg_get_functiondef(p.oid) LIKE '%auth.uid()%'
)
AND n.nspname = 'public';
