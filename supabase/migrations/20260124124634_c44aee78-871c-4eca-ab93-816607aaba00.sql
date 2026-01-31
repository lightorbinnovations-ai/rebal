-- Remove the conflicting public access policies that weren't dropped properly
DROP POLICY IF EXISTS "Public can view public company profiles" ON public.public_company_profiles;
DROP POLICY IF EXISTS "Anyone can read short links for redirects" ON public.short_links;

-- The existing "Owners can view full company profile" and owner short links policies are correct
-- Keep "Company owners can manage their short links" as it covers ALL operations