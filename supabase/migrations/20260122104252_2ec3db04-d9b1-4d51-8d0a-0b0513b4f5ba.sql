-- Fix public data exposure: remove public SELECT on companies and expose only safe public profile data

-- 0) Recreate RPCs safely (need DROP first because return types are changing)
DROP FUNCTION IF EXISTS public.get_public_company_profile(text);
DROP FUNCTION IF EXISTS public.get_public_company_by_id(uuid);

-- 1) Remove overly-permissive public SELECT policy on the companies table
DROP POLICY IF EXISTS "Public can view company profiles" ON public.companies;

-- 2) Create a safe, public-facing projection table (no contact info, no financial/subscription fields)
CREATE TABLE IF NOT EXISTS public.public_company_profiles (
  id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  tagline text,
  description text,
  logo_url text,
  hero_image_url text,
  primary_color text,
  secondary_color text,
  font_heading text,
  font_body text,
  button_style text,
  footer_bg_color text,
  footer_text_color text,
  facebook text,
  instagram text,
  twitter text,
  linkedin text,
  telegram text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS public_company_profiles_slug_idx ON public.public_company_profiles (slug);

ALTER TABLE public.public_company_profiles ENABLE ROW LEVEL SECURITY;

-- Public can read this safe table
DROP POLICY IF EXISTS "Public can view public company profiles" ON public.public_company_profiles;
CREATE POLICY "Public can view public company profiles"
ON public.public_company_profiles
FOR SELECT
USING (true);

GRANT SELECT ON public.public_company_profiles TO anon, authenticated;

-- 3) Keep the existing API surface used by the frontend: company_profiles
-- Recreate it as a view over the safe projection table
DROP VIEW IF EXISTS public.company_profiles;
CREATE VIEW public.company_profiles WITH (security_invoker = on) AS
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
  is_verified
FROM public.public_company_profiles;

GRANT SELECT ON public.company_profiles TO anon, authenticated;

-- 4) Sync projection table from companies
CREATE OR REPLACE FUNCTION public.sync_public_company_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.public_company_profiles WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.public_company_profiles (
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
    is_verified,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.name,
    NEW.slug,
    NEW.tagline,
    NEW.description,
    NEW.logo_url,
    NEW.hero_image_url,
    NEW.primary_color,
    NEW.secondary_color,
    NEW.font_heading,
    NEW.font_body,
    NEW.button_style,
    NEW.footer_bg_color,
    NEW.footer_text_color,
    NEW.facebook,
    NEW.instagram,
    NEW.twitter,
    NEW.linkedin,
    NEW.telegram,
    NEW.is_verified,
    now()
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
    is_verified = EXCLUDED.is_verified,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_public_company_profiles_upsert ON public.companies;
CREATE TRIGGER sync_public_company_profiles_upsert
AFTER INSERT OR UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.sync_public_company_profile();

DROP TRIGGER IF EXISTS sync_public_company_profiles_delete ON public.companies;
CREATE TRIGGER sync_public_company_profiles_delete
AFTER DELETE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.sync_public_company_profile();

-- 5) Backfill/refresh projection table for existing companies
INSERT INTO public.public_company_profiles (
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
  is_verified,
  created_at,
  updated_at
)
SELECT
  c.id,
  c.name,
  c.slug,
  c.tagline,
  c.description,
  c.logo_url,
  c.hero_image_url,
  c.primary_color,
  c.secondary_color,
  c.font_heading,
  c.font_body,
  c.button_style,
  c.footer_bg_color,
  c.footer_text_color,
  c.facebook,
  c.instagram,
  c.twitter,
  c.linkedin,
  c.telegram,
  c.is_verified,
  c.created_at,
  now()
FROM public.companies c
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
  is_verified = EXCLUDED.is_verified,
  updated_at = now();

-- 6) Recreate public RPCs with ONLY safe fields (avoid alternate exfiltration paths)
CREATE FUNCTION public.get_public_company_profile(company_slug text)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  tagline text,
  description text,
  logo_url text,
  hero_image_url text,
  primary_color text,
  secondary_color text,
  font_heading text,
  font_body text,
  button_style text,
  footer_bg_color text,
  footer_text_color text,
  facebook text,
  instagram text,
  twitter text,
  linkedin text,
  telegram text,
  is_verified boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.name,
    p.slug,
    p.tagline,
    p.description,
    p.logo_url,
    p.hero_image_url,
    p.primary_color,
    p.secondary_color,
    p.font_heading,
    p.font_body,
    p.button_style,
    p.footer_bg_color,
    p.footer_text_color,
    p.facebook,
    p.instagram,
    p.twitter,
    p.linkedin,
    p.telegram,
    p.is_verified
  FROM public.public_company_profiles p
  WHERE p.slug = company_slug;
$$;

CREATE FUNCTION public.get_public_company_by_id(company_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  tagline text,
  description text,
  logo_url text,
  hero_image_url text,
  primary_color text,
  secondary_color text,
  font_heading text,
  font_body text,
  button_style text,
  footer_bg_color text,
  footer_text_color text,
  facebook text,
  instagram text,
  twitter text,
  linkedin text,
  telegram text,
  is_verified boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.name,
    p.slug,
    p.tagline,
    p.description,
    p.logo_url,
    p.hero_image_url,
    p.primary_color,
    p.secondary_color,
    p.font_heading,
    p.font_body,
    p.button_style,
    p.footer_bg_color,
    p.footer_text_color,
    p.facebook,
    p.instagram,
    p.twitter,
    p.linkedin,
    p.telegram,
    p.is_verified
  FROM public.public_company_profiles p
  WHERE p.id = company_id;
$$;