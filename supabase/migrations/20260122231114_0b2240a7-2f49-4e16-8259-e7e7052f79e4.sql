-- Add profile picture URL to companies table for personal branding
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add to public_company_profiles view by recreating the materialized view/table
-- First check if we need to add this column to public_company_profiles
ALTER TABLE public.public_company_profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Update the trigger function to sync profile_picture_url
CREATE OR REPLACE FUNCTION public.sync_public_company_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.public_company_profiles (
    id, name, slug, tagline, description, logo_url, hero_image_url,
    phone, email, address, whatsapp, facebook, instagram, twitter, 
    linkedin, telegram, primary_color, secondary_color, font_heading, 
    font_body, button_style, footer_bg_color, footer_text_color,
    is_verified, created_at, updated_at, profile_picture_url
  ) VALUES (
    NEW.id, NEW.name, NEW.slug, NEW.tagline, NEW.description, 
    NEW.logo_url, NEW.hero_image_url, NEW.phone, NEW.email, NEW.address,
    NEW.whatsapp, NEW.facebook, NEW.instagram, NEW.twitter, NEW.linkedin,
    NEW.telegram, NEW.primary_color, NEW.secondary_color, NEW.font_heading,
    NEW.font_body, NEW.button_style, NEW.footer_bg_color, NEW.footer_text_color,
    NEW.is_verified, NEW.created_at, NEW.updated_at, NEW.profile_picture_url
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
    profile_picture_url = EXCLUDED.profile_picture_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;