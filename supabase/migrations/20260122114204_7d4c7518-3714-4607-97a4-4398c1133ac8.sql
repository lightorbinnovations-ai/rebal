-- Fix the security definer issue by recreating as SECURITY INVOKER (default) with explicit grant
DROP VIEW IF EXISTS company_profiles;

CREATE VIEW company_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  slug,
  tagline,
  description,
  logo_url,
  hero_image_url,
  primary_color,
  secondary_color,
  font_heading,
  font_body,
  button_style,
  footer_bg_color,
  footer_text_color,
  facebook,
  instagram,
  twitter,
  linkedin,
  telegram,
  whatsapp,
  phone,
  email,
  address,
  is_verified
FROM companies;

-- Grant select access to authenticated and anonymous users
GRANT SELECT ON company_profiles TO authenticated;
GRANT SELECT ON company_profiles TO anon;