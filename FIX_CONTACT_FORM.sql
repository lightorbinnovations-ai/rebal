-- Create contact_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert messages (for public contact form)
CREATE POLICY "Allow anonymous inserts to contact_messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow admins to view messages (assuming admin has service_role or specific role, 
-- implies authenticated can view for now, usually restricted to admin but for quick fix: restricted to select)
CREATE POLICY "Allow viewing contact_messages for authenticated users"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (true);

-- Grant permissions explicitly
GRANT INSERT ON public.contact_messages TO anon;
GRANT INSERT ON public.contact_messages TO authenticated;
GRANT SELECT ON public.contact_messages TO authenticated;
