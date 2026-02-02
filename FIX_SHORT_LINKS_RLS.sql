-- Enable RLS on short_links if not already enabled
ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to clean up
DROP POLICY IF EXISTS "Public can read short links" ON short_links;

-- Create policy to allow ANYONE to read short_links
CREATE POLICY "Public can read short links"
ON short_links FOR SELECT
TO anon, authenticated, service_role
USING (true);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'short_links';
