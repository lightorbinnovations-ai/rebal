-- STEP 1: Drop ALL existing policies on contact_messages
DROP POLICY IF EXISTS "Allow anonymous inserts to contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow viewing contact_messages for authenticated users" ON public.contact_messages;
DROP POLICY IF EXISTS "Super admins can view all contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Super admins can update contact messages" ON public.contact_messages;

-- STEP 2: Disable RLS temporarily to clear the slate
ALTER TABLE public.contact_messages DISABLE ROW LEVEL SECURITY;

-- STEP 3: Re-enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create ONE simple policy that allows EVERYONE to insert
CREATE POLICY "allow_all_inserts"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- STEP 5: Allow authenticated users to view (for admin)
CREATE POLICY "allow_authenticated_select"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (true);

-- STEP 6: Grant explicit permissions
GRANT INSERT ON public.contact_messages TO anon;
GRANT INSERT ON public.contact_messages TO authenticated;
GRANT SELECT ON public.contact_messages TO authenticated;
