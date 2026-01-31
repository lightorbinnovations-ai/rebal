-- 1. Create realtor_stats table
CREATE TABLE IF NOT EXISTS public.realtor_stats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    years_experience integer DEFAULT 0,
    satisfaction_rate integer DEFAULT 100,
    active_listings integer DEFAULT 0,
    total_applicants integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(company_id)
);

-- RLS for realtor_stats
ALTER TABLE public.realtor_stats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'realtor_stats' AND policyname = 'Public can view realtor stats'
    ) THEN
        CREATE POLICY "Public can view realtor stats" ON public.realtor_stats FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'realtor_stats' AND policyname = 'Owners can manage their own stats'
    ) THEN
        CREATE POLICY "Owners can manage their own stats" ON public.realtor_stats FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 2. Add columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_domain text,
ADD COLUMN IF NOT EXISTS personal_bio text;

-- 3. Update public company profile RPC to include services
DROP FUNCTION IF EXISTS get_public_company_profile_safe(text);
CREATE OR REPLACE FUNCTION get_public_company_profile_safe(company_slug text)
RETURNS TABLE (
    id uuid,
    slug text,
    name text,
    tagline text,
    description text,
    logo_url text,
    hero_image_url text,
    profile_picture_url text,
    phone text,
    email text,
    address text,
    whatsapp text,
    telegram text,
    facebook text,
    instagram text,
    twitter text,
    linkedin text,
    is_verified boolean,
    primary_color text,
    secondary_color text,
    font_heading text,
    font_body text,
    button_style text,
    footer_bg_color text,
    footer_text_color text,
    og_title text,
    og_description text,
    og_image_url text,
    personal_bio text,
    custom_domain text,
    services text[]
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.id,
    c.slug,
    c.name,
    c.tagline,
    c.description,
    c.logo_url,
    c.hero_image_url,
    c.profile_picture_url,
    c.phone,
    c.email,
    c.address,
    c.whatsapp,
    c.telegram,
    c.facebook,
    c.instagram,
    c.twitter,
    c.linkedin,
    c.is_verified,
    c.primary_color,
    c.secondary_color,
    c.font_heading,
    c.font_body,
    c.button_style,
    c.footer_bg_color,
    c.footer_text_color,
    c.og_title,
    c.og_description,
    c.og_image_url,
    c.personal_bio,
    c.custom_domain,
    c.services
  FROM public.companies c
  WHERE c.slug = company_slug OR c.custom_domain = company_slug;
$$;
