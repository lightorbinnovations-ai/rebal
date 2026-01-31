-- Drop existing public view policy
DROP POLICY IF EXISTS "Public can view companies" ON public.companies;

-- Create view for public company profiles with safe fields only
CREATE OR REPLACE VIEW public.company_profiles AS
SELECT 
  id,
  slug,
  name,
  tagline,
  description,
  logo_url,
  hero_image_url,
  phone,
  email,
  address,
  whatsapp,
  facebook,
  instagram,
  twitter,
  linkedin,
  telegram,
  primary_color,
  secondary_color,
  font_heading,
  font_body,
  button_style,
  footer_bg_color,
  footer_text_color,
  is_verified
FROM public.companies;

-- Grant public access to the view
GRANT SELECT ON public.company_profiles TO anon, authenticated;

-- Add policy for owners to view their full company data (including sensitive fields)
CREATE POLICY "Owners can view full company data" 
ON public.companies 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add explicit policy for authenticated users to view basic company info for reference lookup
CREATE POLICY "Authenticated users can view company references"
ON public.companies
FOR SELECT
USING (auth.uid() IS NOT NULL);