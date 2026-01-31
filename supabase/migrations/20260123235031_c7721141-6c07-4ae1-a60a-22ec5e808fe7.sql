-- Add OG metadata fields to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Add OG metadata fields to properties table  
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Add OG fields to public_company_profiles table (for public access)
ALTER TABLE public.public_company_profiles
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Update the sync trigger function to include OG fields
CREATE OR REPLACE FUNCTION public.sync_public_company_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.public_company_profiles (
    id, name, slug, tagline, description, logo_url, hero_image_url,
    phone, email, address, whatsapp, facebook, instagram, twitter, 
    linkedin, telegram, primary_color, secondary_color, font_heading, 
    font_body, button_style, footer_bg_color, footer_text_color,
    is_verified, created_at, updated_at, profile_picture_url,
    og_title, og_description, og_image_url
  ) VALUES (
    NEW.id, NEW.name, NEW.slug, NEW.tagline, NEW.description, 
    NEW.logo_url, NEW.hero_image_url, NEW.phone, NEW.email, NEW.address,
    NEW.whatsapp, NEW.facebook, NEW.instagram, NEW.twitter, NEW.linkedin,
    NEW.telegram, NEW.primary_color, NEW.secondary_color, NEW.font_heading,
    NEW.font_body, NEW.button_style, NEW.footer_bg_color, NEW.footer_text_color,
    NEW.is_verified, NEW.created_at, NEW.updated_at, NEW.profile_picture_url,
    NEW.og_title, NEW.og_description, NEW.og_image_url
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    hero_image_url = EXCLUDED.hero_image_url,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    address = EXCLUDED.address,
    whatsapp = EXCLUDED.whatsapp,
    facebook = EXCLUDED.facebook,
    instagram = EXCLUDED.instagram,
    twitter = EXCLUDED.twitter,
    linkedin = EXCLUDED.linkedin,
    telegram = EXCLUDED.telegram,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    font_heading = EXCLUDED.font_heading,
    font_body = EXCLUDED.font_body,
    button_style = EXCLUDED.button_style,
    footer_bg_color = EXCLUDED.footer_bg_color,
    footer_text_color = EXCLUDED.footer_text_color,
    is_verified = EXCLUDED.is_verified,
    updated_at = EXCLUDED.updated_at,
    profile_picture_url = EXCLUDED.profile_picture_url,
    og_title = EXCLUDED.og_title,
    og_description = EXCLUDED.og_description,
    og_image_url = EXCLUDED.og_image_url;
  RETURN NEW;
END;
$function$;

-- Add comment for documentation
COMMENT ON COLUMN public.companies.og_title IS 'Custom Open Graph title for social sharing';
COMMENT ON COLUMN public.companies.og_description IS 'Custom Open Graph description for social sharing';
COMMENT ON COLUMN public.companies.og_image_url IS 'Custom Open Graph image URL for social sharing';
COMMENT ON COLUMN public.properties.og_title IS 'Custom Open Graph title for social sharing (defaults to property title + price)';
COMMENT ON COLUMN public.properties.og_description IS 'Custom Open Graph description for social sharing';
COMMENT ON COLUMN public.properties.og_image_url IS 'Custom Open Graph image URL (defaults to main_image_url)';