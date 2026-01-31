-- COMPREHENSIVE TRIGGER DIAGNOSTIC & FIX
-- This script will identify and fix the trigger issues

-- Step 1: Check the actual schema of critical tables
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('contact_messages', 'support_tickets')
ORDER BY table_name, ordinal_position;
