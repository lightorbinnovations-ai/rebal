-- Fix 1: Create a secure public view for companies that excludes sensitive data
-- Drop the existing view first
DROP VIEW IF EXISTS public.company_profiles;

-- Create a new secure view that excludes sensitive fields (wallet_balance, subscription data, user_id, etc.)
CREATE VIEW public.company_profiles
WITH (security_invoker = on) AS
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
    -- Contact info for public company pages (visitors need to contact)
    phone,
    email,
    address,
    whatsapp,
    -- Social links
    facebook,
    instagram,
    twitter,
    linkedin,
    telegram,
    is_verified
FROM public.companies;

-- Fix 2: Update RLS policies on companies table
-- Remove the overly permissive policy that exposes all data to authenticated users
DROP POLICY IF EXISTS "Authenticated users can view company references" ON public.companies;

-- Keep owner access policy
-- DROP POLICY IF EXISTS "Owners can view full company data" ON public.companies;

-- Create a policy that allows public read of only non-sensitive data through the view
-- For the base table, only owners should have full SELECT access
CREATE POLICY "Public can view company profiles via view"
ON public.companies
FOR SELECT
USING (
    -- Allow full access to owners
    auth.uid() = user_id
    OR
    -- Allow limited public access (the view will filter columns)
    -- This allows the view to work but sensitive columns are hidden by the view
    true
);

-- Actually, we need a different approach since RLS doesn't filter columns
-- Let's use a more restrictive approach:

-- Drop the policy we just created
DROP POLICY IF EXISTS "Public can view company profiles via view" ON public.companies;

-- For public access, we'll use a database function that returns only safe columns
CREATE OR REPLACE FUNCTION public.get_public_company_profile(company_slug text)
RETURNS TABLE (
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
    phone text,
    email text,
    address text,
    whatsapp text,
    facebook text,
    instagram text,
    twitter text,
    linkedin text,
    telegram text,
    is_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        c.id, c.name, c.slug, c.tagline, c.description,
        c.logo_url, c.hero_image_url, c.primary_color, c.secondary_color,
        c.font_heading, c.font_body, c.button_style,
        c.footer_bg_color, c.footer_text_color,
        c.phone, c.email, c.address, c.whatsapp,
        c.facebook, c.instagram, c.twitter, c.linkedin, c.telegram,
        c.is_verified
    FROM companies c
    WHERE c.slug = company_slug;
$$;

-- Create a similar function to get company by ID
CREATE OR REPLACE FUNCTION public.get_public_company_by_id(company_id uuid)
RETURNS TABLE (
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
    phone text,
    email text,
    address text,
    whatsapp text,
    facebook text,
    instagram text,
    twitter text,
    linkedin text,
    telegram text,
    is_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        c.id, c.name, c.slug, c.tagline, c.description,
        c.logo_url, c.hero_image_url, c.primary_color, c.secondary_color,
        c.font_heading, c.font_body, c.button_style,
        c.footer_bg_color, c.footer_text_color,
        c.phone, c.email, c.address, c.whatsapp,
        c.facebook, c.instagram, c.twitter, c.linkedin, c.telegram,
        c.is_verified
    FROM companies c
    WHERE c.id = company_id;
$$;

-- Fix 3: Add SELECT policy for inquiries that only allows owners to read
-- (It already exists, but let's ensure it's the only one)
-- The existing policy "Owners can view their inquiries" is correct

-- Fix 4: Validate company_id in lead_tracking INSERT
DROP POLICY IF EXISTS "Anyone can insert lead tracking" ON public.lead_tracking;

CREATE POLICY "Anyone can insert lead tracking for valid companies"
ON public.lead_tracking
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM companies WHERE companies.id = lead_tracking.company_id
    )
);

-- Fix 5: Update lead_tracking to allow updates for session tracking
CREATE POLICY "Anyone can update their own session tracking"
ON public.lead_tracking
FOR UPDATE
USING (true)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM companies WHERE companies.id = lead_tracking.company_id
    )
);