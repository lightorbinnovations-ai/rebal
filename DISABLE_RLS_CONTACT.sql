-- NUCLEAR OPTION: Completely disable RLS on contact_messages
-- This will allow anyone to insert without any policy checks

-- First, verify the table exists and show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'contact_messages';

-- Drop ALL policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'contact_messages' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.contact_messages';
    END LOOP;
END $$;

-- COMPLETELY DISABLE RLS (this is the nuclear option)
ALTER TABLE public.contact_messages DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON public.contact_messages TO anon;
GRANT ALL ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'contact_messages' AND schemaname = 'public';
