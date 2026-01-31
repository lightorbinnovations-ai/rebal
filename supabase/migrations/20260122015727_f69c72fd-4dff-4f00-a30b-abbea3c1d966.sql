-- Drop and recreate view with SECURITY INVOKER (default, explicit for clarity)
DROP VIEW IF EXISTS public.company_profiles;

CREATE VIEW public.company_profiles 
WITH (security_invoker = true) AS
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

-- Re-grant public access to the view
GRANT SELECT ON public.company_profiles TO anon, authenticated;