-- Drop existing view first to recreate with different columns
DROP VIEW IF EXISTS public.public_company_profiles_safe;

-- Create a safe public view for company profiles without sensitive contact info
CREATE VIEW public.public_company_profiles_safe
WITH (security_invoker = on)
AS SELECT
  id,
  name,
  slug,
  tagline,
  description,
  logo_url,
  hero_image_url,
  profile_picture_url,
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
  is_verified,
  og_title,
  og_description,
  og_image_url,
  created_at,
  updated_at
FROM public.public_company_profiles;

-- Grant access to the safe view
GRANT SELECT ON public.public_company_profiles_safe TO anon, authenticated;

-- Restrict direct access to public_company_profiles table
DROP POLICY IF EXISTS "Anyone can view public company profiles" ON public.public_company_profiles;
DROP POLICY IF EXISTS "Public can view company profiles" ON public.public_company_profiles;
DROP POLICY IF EXISTS "Public company profiles are viewable by everyone" ON public.public_company_profiles;

-- Only authenticated users who own the company can see full contact details directly
CREATE POLICY "Owners can view full company profile"
ON public.public_company_profiles
FOR SELECT
USING (
  id IN (
    SELECT id FROM public.companies WHERE user_id = auth.uid()
  )
);

-- Create a security definer function to get public company profile (includes contact for public pages)
CREATE OR REPLACE FUNCTION public.get_public_company_profile_safe(company_slug text)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  tagline text,
  description text,
  logo_url text,
  hero_image_url text,
  profile_picture_url text,
  phone text,
  email text,
  address text,
  whatsapp text,
  facebook text,
  instagram text,
  twitter text,
  linkedin text,
  telegram text,
  primary_color text,
  secondary_color text,
  font_heading text,
  font_body text,
  button_style text,
  footer_bg_color text,
  footer_text_color text,
  is_verified boolean,
  og_title text,
  og_description text,
  og_image_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.slug,
    p.tagline,
    p.description,
    p.logo_url,
    p.hero_image_url,
    p.profile_picture_url,
    p.phone,
    p.email,
    p.address,
    p.whatsapp,
    p.facebook,
    p.instagram,
    p.twitter,
    p.linkedin,
    p.telegram,
    p.primary_color,
    p.secondary_color,
    p.font_heading,
    p.font_body,
    p.button_style,
    p.footer_bg_color,
    p.footer_text_color,
    p.is_verified,
    p.og_title,
    p.og_description,
    p.og_image_url
  FROM public.public_company_profiles p
  WHERE p.slug = company_slug;
$$;