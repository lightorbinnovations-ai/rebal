-- FIND TRIGGERS AND HOOKS
-- This script lists all triggers on auth.users to see if one is breaking login

SELECT 
    event_object_schema as table_schema,
    event_object_table as table_name,
    trigger_schema,
    trigger_name,
    event_manipulation as event,
    action_timing as timing,
    action_statement as definition
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- Also check if there are any broken functions usually called by triggers
-- like 'handle_new_user'
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('handle_new_user', 'on_auth_user_created');
