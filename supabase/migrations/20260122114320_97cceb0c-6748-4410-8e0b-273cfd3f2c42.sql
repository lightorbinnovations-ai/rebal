-- Add missing contact columns to public_company_profiles table
ALTER TABLE public_company_profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS whatsapp text;

-- Create or replace the trigger function to sync company data to public profiles
CREATE OR REPLACE FUNCTION sync_public_company_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public_company_profiles (
    id, name, slug, tagline, description, logo_url, hero_image_url,
    primary_color, secondary_color, font_heading, font_body, button_style,
    footer_bg_color, footer_text_color, facebook, instagram, twitter, linkedin, telegram,
    whatsapp, phone, email, address, is_verified, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.name, NEW.slug, NEW.tagline, NEW.description, NEW.logo_url, NEW.hero_image_url,
    NEW.primary_color, NEW.secondary_color, NEW.font_heading, NEW.font_body, NEW.button_style,
    NEW.footer_bg_color, NEW.footer_text_color, NEW.facebook, NEW.instagram, NEW.twitter, NEW.linkedin, NEW.telegram,
    NEW.whatsapp, NEW.phone, NEW.email, NEW.address, NEW.is_verified, NEW.created_at, NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    hero_image_url = EXCLUDED.hero_image_url,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    font_heading = EXCLUDED.font_heading,
    font_body = EXCLUDED.font_body,
    button_style = EXCLUDED.button_style,
    footer_bg_color = EXCLUDED.footer_bg_color,
    footer_text_color = EXCLUDED.footer_text_color,
    facebook = EXCLUDED.facebook,
    instagram = EXCLUDED.instagram,
    twitter = EXCLUDED.twitter,
    linkedin = EXCLUDED.linkedin,
    telegram = EXCLUDED.telegram,
    whatsapp = EXCLUDED.whatsapp,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    address = EXCLUDED.address,
    is_verified = EXCLUDED.is_verified,
    updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_company_to_public_profile ON companies;

CREATE TRIGGER sync_company_to_public_profile
AFTER INSERT OR UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION sync_public_company_profile();

-- Sync existing companies to public_company_profiles
INSERT INTO public_company_profiles (
  id, name, slug, tagline, description, logo_url, hero_image_url,
  primary_color, secondary_color, font_heading, font_body, button_style,
  footer_bg_color, footer_text_color, facebook, instagram, twitter, linkedin, telegram,
  whatsapp, phone, email, address, is_verified, created_at, updated_at
)
SELECT 
  id, name, slug, tagline, description, logo_url, hero_image_url,
  primary_color, secondary_color, font_heading, font_body, button_style,
  footer_bg_color, footer_text_color, facebook, instagram, twitter, linkedin, telegram,
  whatsapp, phone, email, address, is_verified, created_at, updated_at
FROM companies
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  logo_url = EXCLUDED.logo_url,
  hero_image_url = EXCLUDED.hero_image_url,
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color,
  font_heading = EXCLUDED.font_heading,
  font_body = EXCLUDED.font_body,
  button_style = EXCLUDED.button_style,
  footer_bg_color = EXCLUDED.footer_bg_color,
  footer_text_color = EXCLUDED.footer_text_color,
  facebook = EXCLUDED.facebook,
  instagram = EXCLUDED.instagram,
  twitter = EXCLUDED.twitter,
  linkedin = EXCLUDED.linkedin,
  telegram = EXCLUDED.telegram,
  whatsapp = EXCLUDED.whatsapp,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  address = EXCLUDED.address,
  is_verified = EXCLUDED.is_verified,
  updated_at = EXCLUDED.updated_at;