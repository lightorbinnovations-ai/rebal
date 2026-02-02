-- FIX PUBLIC ACCESS FOR OG PREVIEWS AND MARKETPLACE
-- Essential for: Social Sharing, SEO, and Public Listing View

-- 1. COMPANIES: Allow everyone to view company profiles (name, logo, etc.)
DROP POLICY IF EXISTS "Public can view active companies" ON companies;
CREATE POLICY "Public can view active companies"
ON companies FOR SELECT
TO anon, authenticated, service_role
USING (true); 
-- Note: 'true' allows viewing all. You could filter by 'status = active' if you have a status column.

-- 2. PROPERTIES: Allow everyone to view properties
DROP POLICY IF EXISTS "Public can view properties" ON properties;
CREATE POLICY "Public can view properties"
ON properties FOR SELECT
TO anon, authenticated, service_role
USING (true);

-- 3. SHORT LINKS: Ensure everyone can resolve short links (Double Check)
DROP POLICY IF EXISTS "Public can read short links" ON short_links;
CREATE POLICY "Public can read short links"
ON short_links FOR SELECT
TO anon, authenticated, service_role
USING (true);

-- 4. CLEANUP: Remove the explicit 'deny' policy if it exists (it's redundant and confusing)
DROP POLICY IF EXISTS "deny_anon_companies" ON companies;

-- Verify changes
SELECT 
    tablename, 
    policyname, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename IN ('companies', 'properties', 'short_links')
ORDER BY tablename;
