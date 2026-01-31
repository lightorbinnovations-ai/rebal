-- REBAL Complete Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- ============================================
-- 1. ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'moderator', 'user');

-- ============================================
-- 2. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 3. TABLES
-- ============================================

-- Nigerian Locations (reference data)
CREATE TABLE public.nigerian_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL,
  city TEXT,
  area TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscription Plans
CREATE TABLE public.subscription_plans (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price INTEGER NOT NULL DEFAULT 0,
  yearly_price INTEGER NOT NULL DEFAULT 0,
  max_properties INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Companies
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT,
  description TEXT,
  logo_url TEXT,
  hero_image_url TEXT,
  profile_picture_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  whatsapp TEXT,
  facebook TEXT,
  instagram TEXT,
  twitter TEXT,
  linkedin TEXT,
  telegram TEXT,
  primary_color TEXT DEFAULT '#0F172A',
  secondary_color TEXT DEFAULT '#3B82F6',
  font_heading TEXT DEFAULT 'Inter',
  font_body TEXT DEFAULT 'Open Sans',
  button_style TEXT DEFAULT 'rounded',
  footer_bg_color TEXT DEFAULT '#0F172A',
  footer_text_color TEXT DEFAULT '#FFFFFF',
  account_type TEXT DEFAULT 'realtor',  -- 'realtor' or 'affiliate'
  referral_code TEXT,
  referred_by UUID REFERENCES public.companies(id),
  wallet_balance NUMERIC DEFAULT 0,
  subscription_status TEXT DEFAULT 'trialing',
  subscription_end_date TIMESTAMPTZ,
  max_properties INTEGER DEFAULT 1,  -- Trial limit is 1 property
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  last_email_confirmed_at TIMESTAMPTZ,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public Company Profiles (mirror table for public access)
CREATE TABLE public.public_company_profiles (
  id UUID NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  logo_url TEXT,
  hero_image_url TEXT,
  profile_picture_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  whatsapp TEXT,
  facebook TEXT,
  instagram TEXT,
  twitter TEXT,
  linkedin TEXT,
  telegram TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  font_heading TEXT,
  font_body TEXT,
  button_style TEXT,
  footer_bg_color TEXT,
  footer_text_color TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Properties
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  property_type TEXT NOT NULL,
  purpose TEXT NOT NULL,
  features TEXT[],
  main_image_url TEXT,
  gallery_urls TEXT[],
  location TEXT,
  address TEXT,
  state TEXT,
  city TEXT,
  area TEXT,
  landmark TEXT,
  status TEXT NOT NULL DEFAULT 'Available',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority_score INTEGER DEFAULT 1,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, slug)
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trialing',
  billing_interval TEXT DEFAULT 'monthly',
  paystack_subscription_code TEXT,
  paystack_customer_code TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  grace_period_end TIMESTAMPTZ,
  failed_payment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending',
  paystack_reference TEXT NOT NULL,
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inquiries
CREATE TABLE public.inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  lead_score TEXT DEFAULT 'cold',
  page_views INTEGER DEFAULT 0,
  properties_viewed INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analytics
CREATE TABLE public.analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Tracking
CREATE TABLE public.lead_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  page_views INTEGER DEFAULT 1,
  properties_viewed TEXT[] DEFAULT '{}',
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Short Links
CREATE TABLE public.short_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  short_code TEXT NOT NULL UNIQUE,
  full_path TEXT NOT NULL,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Referrals
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.companies(id),
  referred_id UUID NOT NULL REFERENCES public.companies(id),
  status TEXT NOT NULL DEFAULT 'pending',
  reward_amount NUMERIC NOT NULL DEFAULT 500,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Referral Commissions
CREATE TABLE public.referral_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.companies(id),
  referred_id UUID NOT NULL REFERENCES public.companies(id),
  payment_amount NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 0.10,
  commission_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Referral Visits
CREATE TABLE public.referral_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  visitor_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  converted_at TIMESTAMPTZ,
  converted_company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Referral Events
CREATE TABLE public.referral_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  event_type TEXT NOT NULL,
  visitor_fingerprint TEXT,
  referrer_company_id UUID REFERENCES public.companies(id),
  referred_company_id UUID REFERENCES public.companies(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Saved Searches
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Custom Domains
CREATE TABLE public.custom_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  verification_token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Verification Requests
CREATE TABLE public.verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  business_registration TEXT,
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support Tickets
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  admin_response TEXT,
  responded_by UUID,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Withdrawal Requests
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email Reverification Tokens
CREATE TABLE public.email_reverification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Activity Log
CREATE TABLE public.admin_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Notifications Log
CREATE TABLE public.admin_notifications_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Platform Settings
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rate Limits
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 4. VIEWS
-- ============================================

-- Safe view for public company profiles (excludes PII)
CREATE OR REPLACE VIEW public.public_company_profiles_safe AS
SELECT 
  id, name, slug, tagline, description,
  logo_url, hero_image_url, profile_picture_url,
  facebook, instagram, twitter, linkedin, telegram,
  primary_color, secondary_color, font_heading, font_body,
  button_style, footer_bg_color, footer_text_color,
  is_verified, og_title, og_description, og_image_url,
  created_at, updated_at
FROM public.public_company_profiles;

-- Safe view for custom domains
CREATE OR REPLACE VIEW public.custom_domains_safe AS
SELECT id, company_id, domain, status, verified_at, created_at, updated_at
FROM public.custom_domains;

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if subscription is active
CREATE OR REPLACE FUNCTION public.is_subscription_active(company_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT 
      CASE 
        WHEN subscription_status = 'active' THEN true
        WHEN subscription_status = 'trialing' AND subscription_end_date > now() THEN true
        ELSE false
      END
    FROM public.companies WHERE id = company_uuid),
    false
  )
$$;

-- Generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.referral_code := UPPER(LEFT(REPLACE(NEW.slug, '-', ''), 6)) || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 4));
  RETURN NEW;
END;
$$;

-- Set trial end date
CREATE OR REPLACE FUNCTION public.set_trial_end_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.subscription_status := 'trialing';
  NEW.subscription_end_date := NEW.created_at + INTERVAL '14 days';
  NEW.max_properties := 1;
  RETURN NEW;
END;
$$;

-- Update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Generate short code
CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result text := '';
  i integer;
  code_exists boolean := true;
BEGIN
  WHILE code_exists LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM short_links WHERE short_code = result) INTO code_exists;
  END LOOP;
  RETURN result;
END;
$$;

-- Increment short link click
CREATE OR REPLACE FUNCTION public.increment_short_link_click(p_short_code TEXT)
RETURNS TABLE(full_path TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE short_links
  SET click_count = click_count + 1, updated_at = now()
  WHERE short_code = p_short_code;

  RETURN QUERY SELECT sl.full_path FROM short_links sl WHERE sl.short_code = p_short_code;
END;
$$;

-- Check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier TEXT, p_endpoint TEXT, p_max_requests INTEGER, p_window_seconds INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_current_count integer;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;
  
  DELETE FROM rate_limits 
  WHERE identifier = p_identifier AND endpoint = p_endpoint AND window_start < v_window_start;
  
  SELECT COALESCE(SUM(request_count), 0) INTO v_current_count
  FROM rate_limits
  WHERE identifier = p_identifier AND endpoint = p_endpoint AND window_start >= v_window_start;
  
  IF v_current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  INSERT INTO rate_limits (identifier, endpoint, window_start) VALUES (p_identifier, p_endpoint, now());
  RETURN true;
END;
$$;

-- Search public properties
CREATE OR REPLACE FUNCTION public.search_public_properties(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_property_type TEXT DEFAULT NULL,
  p_purpose TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID, title TEXT, slug TEXT, description TEXT, price NUMERIC,
  property_type TEXT, purpose TEXT, state TEXT, city TEXT, area TEXT,
  main_image_url TEXT, features TEXT[], priority_score INTEGER,
  created_at TIMESTAMPTZ, company_id UUID, company_name TEXT,
  company_slug TEXT, company_logo TEXT, company_verified BOOLEAN,
  subscription_tier TEXT, total_count BIGINT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM public.properties p
  JOIN public.companies c ON p.company_id = c.id
  WHERE p.is_active = true
    AND is_subscription_active(p.company_id)
    AND (p_property_type IS NULL OR p.property_type = p_property_type)
    AND (p_purpose IS NULL OR p.purpose = p_purpose)
    AND (p_state IS NULL OR p.state = p_state)
    AND (p_city IS NULL OR p.city = p_city)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_search_query IS NULL OR 
         p.title ILIKE '%' || p_search_query || '%' OR 
         p.description ILIKE '%' || p_search_query || '%' OR
         p.location ILIKE '%' || p_search_query || '%');

  RETURN QUERY
  SELECT 
    p.id, p.title, p.slug, p.description, p.price,
    p.property_type, p.purpose, p.state, p.city, p.area,
    p.main_image_url, p.features, p.priority_score, p.created_at,
    c.id as company_id, c.name as company_name, c.slug as company_slug,
    c.logo_url as company_logo, c.is_verified as company_verified,
    c.subscription_status as subscription_tier, v_total as total_count
  FROM public.properties p
  JOIN public.companies c ON p.company_id = c.id
  WHERE p.is_active = true
    AND is_subscription_active(p.company_id)
    AND (p_property_type IS NULL OR p.property_type = p_property_type)
    AND (p_purpose IS NULL OR p.purpose = p_purpose)
    AND (p_state IS NULL OR p.state = p_state)
    AND (p_city IS NULL OR p.city = p_city)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_search_query IS NULL OR 
         p.title ILIKE '%' || p_search_query || '%' OR 
         p.description ILIKE '%' || p_search_query || '%' OR
         p.location ILIKE '%' || p_search_query || '%')
  ORDER BY p.priority_score DESC, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Get public company profile (safe version)
CREATE OR REPLACE FUNCTION public.get_public_company_profile_safe(company_slug TEXT)
RETURNS TABLE(
  id UUID, name TEXT, slug TEXT, tagline TEXT, description TEXT,
  logo_url TEXT, hero_image_url TEXT, profile_picture_url TEXT,
  phone TEXT, email TEXT, address TEXT, whatsapp TEXT,
  facebook TEXT, instagram TEXT, twitter TEXT, linkedin TEXT, telegram TEXT,
  primary_color TEXT, secondary_color TEXT, font_heading TEXT, font_body TEXT,
  button_style TEXT, footer_bg_color TEXT, footer_text_color TEXT,
  is_verified BOOLEAN, og_title TEXT, og_description TEXT, og_image_url TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.name, p.slug, p.tagline, p.description,
    p.logo_url, p.hero_image_url, p.profile_picture_url,
    p.phone, p.email, p.address, p.whatsapp,
    p.facebook, p.instagram, p.twitter, p.linkedin, p.telegram,
    p.primary_color, p.secondary_color, p.font_heading, p.font_body,
    p.button_style, p.footer_bg_color, p.footer_text_color,
    p.is_verified, p.og_title, p.og_description, p.og_image_url
  FROM public.public_company_profiles p
  WHERE p.slug = company_slug;
$$;

-- Get public company by ID
CREATE OR REPLACE FUNCTION public.get_public_company_by_id(company_id UUID)
RETURNS TABLE(
  id UUID, name TEXT, slug TEXT, tagline TEXT, description TEXT,
  logo_url TEXT, hero_image_url TEXT, primary_color TEXT, secondary_color TEXT,
  font_heading TEXT, font_body TEXT, button_style TEXT,
  footer_bg_color TEXT, footer_text_color TEXT, facebook TEXT,
  instagram TEXT, twitter TEXT, linkedin TEXT, telegram TEXT, is_verified BOOLEAN
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.name, p.slug, p.tagline, p.description,
    p.logo_url, p.hero_image_url, p.primary_color, p.secondary_color,
    p.font_heading, p.font_body, p.button_style,
    p.footer_bg_color, p.footer_text_color, p.facebook,
    p.instagram, p.twitter, p.linkedin, p.telegram, p.is_verified
  FROM public.public_company_profiles p
  WHERE p.id = company_id;
$$;

-- Sync public company profile
CREATE OR REPLACE FUNCTION public.sync_public_company_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    name = EXCLUDED.name, slug = EXCLUDED.slug, tagline = EXCLUDED.tagline,
    description = EXCLUDED.description, logo_url = EXCLUDED.logo_url,
    hero_image_url = EXCLUDED.hero_image_url, phone = EXCLUDED.phone,
    email = EXCLUDED.email, address = EXCLUDED.address, whatsapp = EXCLUDED.whatsapp,
    facebook = EXCLUDED.facebook, instagram = EXCLUDED.instagram,
    twitter = EXCLUDED.twitter, linkedin = EXCLUDED.linkedin,
    telegram = EXCLUDED.telegram, primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color, font_heading = EXCLUDED.font_heading,
    font_body = EXCLUDED.font_body, button_style = EXCLUDED.button_style,
    footer_bg_color = EXCLUDED.footer_bg_color, footer_text_color = EXCLUDED.footer_text_color,
    is_verified = EXCLUDED.is_verified, updated_at = EXCLUDED.updated_at,
    profile_picture_url = EXCLUDED.profile_picture_url,
    og_title = EXCLUDED.og_title, og_description = EXCLUDED.og_description,
    og_image_url = EXCLUDED.og_image_url;
  RETURN NEW;
END;
$$;

-- Notify on inquiry
CREATE OR REPLACE FUNCTION public.notify_on_inquiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_user_id UUID;
  property_title TEXT;
BEGIN
  SELECT user_id INTO company_user_id FROM public.companies WHERE id = NEW.company_id;
  
  IF NEW.property_id IS NOT NULL THEN
    SELECT title INTO property_title FROM public.properties WHERE id = NEW.property_id;
  END IF;
  
  INSERT INTO public.notifications (user_id, company_id, type, title, message, metadata)
  VALUES (
    company_user_id, NEW.company_id, 'inquiry', 'New Inquiry Received',
    COALESCE('New inquiry from ' || NEW.name || ' about ' || property_title, 'New inquiry from ' || NEW.name),
    jsonb_build_object('inquiry_id', NEW.id, 'property_id', NEW.property_id, 'customer_name', NEW.name)
  );
  
  RETURN NEW;
END;
$$;

-- Notify on payment
CREATE OR REPLACE FUNCTION public.notify_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_user_id UUID;
  plan_name TEXT;
BEGIN
  IF NEW.status = 'success' AND (OLD IS NULL OR OLD.status != 'success') THEN
    SELECT user_id INTO company_user_id FROM public.companies WHERE id = NEW.company_id;
    plan_name := COALESCE(NEW.metadata->>'plan_name', 'subscription');
    
    INSERT INTO public.notifications (user_id, company_id, type, title, message, metadata)
    VALUES (
      company_user_id, NEW.company_id, 'payment', 'Payment Successful',
      'Your payment of ₦' || NEW.amount || ' for ' || plan_name || ' has been processed successfully.',
      jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Notify referrer on payment
CREATE OR REPLACE FUNCTION public.notify_referrer_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_user_id UUID;
  referred_name TEXT;
  commission_earned NUMERIC;
BEGIN
  IF NEW.status = 'completed' AND 
     (OLD.status = 'pending' OR (OLD.reward_amount IS DISTINCT FROM NEW.reward_amount AND NEW.reward_amount > OLD.reward_amount)) THEN
    
    SELECT user_id INTO referrer_user_id FROM public.companies WHERE id = NEW.referrer_id;
    SELECT name INTO referred_name FROM public.companies WHERE id = NEW.referred_id;
    commission_earned := NEW.reward_amount - COALESCE(OLD.reward_amount, 0);
    
    IF commission_earned > 0 THEN
      INSERT INTO public.notifications (user_id, company_id, type, title, message, metadata)
      VALUES (
        referrer_user_id, NEW.referrer_id, 'referral', '💰 Commission Earned!',
        referred_name || ' made a payment! You earned ₦' || commission_earned || ' commission (10% of their subscription).',
        jsonb_build_object('referral_id', NEW.id, 'commission', commission_earned, 'referred_company', referred_name, 'total_earnings', NEW.reward_amount)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add referral commission
CREATE OR REPLACE FUNCTION public.add_referral_commission(p_referrer_id UUID, p_referred_id UUID, p_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE referrals 
  SET reward_amount = COALESCE(reward_amount, 0) + p_amount, status = 'completed'
  WHERE referrer_id = p_referrer_id AND referred_id = p_referred_id;
END;
$$;

-- Add to wallet
CREATE OR REPLACE FUNCTION public.add_to_wallet(p_company_id UUID, p_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE companies SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount WHERE id = p_company_id;
END;
$$;

-- Lead tracking rate limit
CREATE OR REPLACE FUNCTION public.check_lead_tracking_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.lead_tracking
  WHERE session_id LIKE 'session_%'
    AND created_at > NOW() - INTERVAL '1 hour'
    AND SUBSTRING(session_id, 1, 30) = SUBSTRING(NEW.session_id, 1, 30);
  
  IF recent_count >= 100 THEN
    RAISE EXCEPTION 'Rate limit exceeded for lead tracking';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Validate lead tracking update
CREATE OR REPLACE FUNCTION public.validate_lead_tracking_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  time_increment integer;
  page_increment integer;
BEGIN
  time_increment := NEW.time_spent_seconds - COALESCE(OLD.time_spent_seconds, 0);
  page_increment := NEW.page_views - COALESCE(OLD.page_views, 0);
  
  IF time_increment > 3600 THEN
    RAISE EXCEPTION 'Invalid time update: exceeds maximum allowed increment of 1 hour';
  END IF;
  
  IF NEW.time_spent_seconds < 0 OR NEW.page_views < 0 THEN
    RAISE EXCEPTION 'Negative values not allowed for tracking metrics';
  END IF;
  
  IF page_increment > 20 THEN
    RAISE EXCEPTION 'Invalid page views update: exceeds maximum allowed increment';
  END IF;
  
  IF OLD.created_at < NOW() - INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'Cannot update expired tracking session';
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Company triggers
CREATE TRIGGER generate_company_referral_code
  BEFORE INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

CREATE TRIGGER set_company_trial
  BEFORE INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_trial_end_date();

CREATE TRIGGER sync_company_profile
  AFTER INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.sync_public_company_profile();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Property triggers
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inquiry triggers
CREATE TRIGGER notify_on_new_inquiry
  AFTER INSERT ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_inquiry();

-- Payment triggers
CREATE TRIGGER notify_on_successful_payment
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_payment();

-- Referral triggers
CREATE TRIGGER notify_referrer_payment
  AFTER UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.notify_referrer_on_payment();

-- Lead tracking triggers
CREATE TRIGGER check_lead_tracking_rate
  BEFORE INSERT ON public.lead_tracking
  FOR EACH ROW EXECUTE FUNCTION public.check_lead_tracking_rate_limit();

CREATE TRIGGER validate_tracking_update
  BEFORE UPDATE ON public.lead_tracking
  FOR EACH ROW EXECUTE FUNCTION public.validate_lead_tracking_update();

-- Updated at triggers for other tables
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_short_links_updated_at
  BEFORE UPDATE ON public.short_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_domains_updated_at
  BEFORE UPDATE ON public.custom_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_reverification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nigerian_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_company_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RLS POLICIES
-- ============================================

-- Companies policies
CREATE POLICY "Company owners can access their full data" ON public.companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own company" ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own company" ON public.companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own company" ON public.companies FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "deny_anon_companies" ON public.companies FOR SELECT USING (false);

-- Properties policies
CREATE POLICY "Owners can view all their properties" ON public.properties FOR SELECT USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = properties.company_id AND companies.user_id = auth.uid()));
CREATE POLICY "Public can view active properties with valid subscription" ON public.properties FOR SELECT USING (is_active = true AND is_subscription_active(company_id));
CREATE POLICY "Owners can insert properties" ON public.properties FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = properties.company_id AND companies.user_id = auth.uid()));
CREATE POLICY "Owners can update their properties" ON public.properties FOR UPDATE USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = properties.company_id AND companies.user_id = auth.uid()));
CREATE POLICY "Owners can delete their properties" ON public.properties FOR DELETE USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = properties.company_id AND companies.user_id = auth.uid()));

-- Subscriptions policies
CREATE POLICY "Users can view their company subscription" ON public.subscriptions FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Deny anonymous SELECT on subscriptions" ON public.subscriptions FOR SELECT USING (false);

-- Payments policies
CREATE POLICY "Users can view their company payments" ON public.payments FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can view all payments" ON public.payments FOR SELECT USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage payments" ON public.payments FOR ALL USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Service role can manage payments" ON public.payments FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Deny anonymous access to payments" ON public.payments FOR SELECT USING (false);

-- Inquiries policies
CREATE POLICY "Anyone can submit inquiries" ON public.inquiries FOR INSERT WITH CHECK ((EXISTS (SELECT 1 FROM companies c WHERE c.id = inquiries.company_id)) AND (property_id IS NULL OR EXISTS (SELECT 1 FROM properties p WHERE p.id = inquiries.property_id AND p.company_id = inquiries.company_id)));
CREATE POLICY "Owners can view their inquiries" ON public.inquiries FOR SELECT USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = inquiries.company_id AND companies.user_id = auth.uid()));
CREATE POLICY "Owners can update their inquiries" ON public.inquiries FOR UPDATE USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = inquiries.company_id AND companies.user_id = auth.uid()));
CREATE POLICY "Super admins can view all inquiries" ON public.inquiries FOR SELECT USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "deny_anon_inquiries" ON public.inquiries FOR SELECT USING (false);

-- Analytics policies
CREATE POLICY "Anyone can insert analytics" ON public.analytics FOR INSERT WITH CHECK ((EXISTS (SELECT 1 FROM companies c WHERE c.id = analytics.company_id)) AND (property_id IS NULL OR EXISTS (SELECT 1 FROM properties p WHERE p.id = analytics.property_id AND p.company_id = analytics.company_id)));
CREATE POLICY "Owners can view their analytics" ON public.analytics FOR SELECT USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = analytics.company_id AND companies.user_id = auth.uid()));
CREATE POLICY "Deny anonymous SELECT on analytics" ON public.analytics FOR SELECT USING (false);

-- Lead tracking policies
CREATE POLICY "Anyone can insert lead tracking for valid companies" ON public.lead_tracking FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = lead_tracking.company_id));
CREATE POLICY "Owners can view their lead tracking" ON public.lead_tracking FOR SELECT USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = lead_tracking.company_id AND companies.user_id = auth.uid()));
CREATE POLICY "Users can update their own session tracking" ON public.lead_tracking FOR UPDATE USING ((EXISTS (SELECT 1 FROM companies WHERE companies.id = lead_tracking.company_id)) AND created_at > (now() - '24:00:00'::interval)) WITH CHECK ((EXISTS (SELECT 1 FROM companies WHERE companies.id = lead_tracking.company_id)) AND time_spent_seconds >= 0 AND time_spent_seconds <= 86400 AND page_views >= 0 AND page_views <= 1000);
CREATE POLICY "Deny anonymous SELECT on lead_tracking" ON public.lead_tracking FOR SELECT USING (false);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage notifications" ON public.notifications FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Deny anonymous SELECT on notifications" ON public.notifications FOR SELECT USING (false);

-- Short links policies
CREATE POLICY "Company owners can manage their short links" ON public.short_links FOR ALL USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = short_links.company_id AND companies.user_id = auth.uid()));

-- Referrals policies
CREATE POLICY "Users can view their referrals" ON public.referrals FOR SELECT USING (EXISTS (SELECT 1 FROM companies WHERE (companies.id = referrals.referrer_id OR companies.id = referrals.referred_id) AND companies.user_id = auth.uid()));
CREATE POLICY "Super admins can view all referrals" ON public.referrals FOR SELECT USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update referrals" ON public.referrals FOR UPDATE USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Deny anonymous SELECT on referrals" ON public.referrals FOR SELECT USING (false);

-- Referral commissions policies
CREATE POLICY "Users can view their commission history" ON public.referral_commissions FOR SELECT USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = referral_commissions.referrer_id AND companies.user_id = auth.uid()));
CREATE POLICY "Service role can manage commissions" ON public.referral_commissions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Deny anonymous SELECT on referral_commissions" ON public.referral_commissions FOR SELECT USING (false);

-- Referral visits/events policies
CREATE POLICY "Service role full access on referral_visits" ON public.referral_visits FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Referrers can view their own events" ON public.referral_events FOR SELECT USING (referrer_company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
CREATE POLICY "Service role can insert events" ON public.referral_events FOR INSERT WITH CHECK (false);

-- Saved searches policies
CREATE POLICY "Users can view their own saved searches" ON public.saved_searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own saved searches" ON public.saved_searches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saved searches" ON public.saved_searches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved searches" ON public.saved_searches FOR DELETE USING (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Deny anonymous access to user_roles" ON public.user_roles FOR ALL USING (false) WITH CHECK (false);

-- Custom domains policies
CREATE POLICY "Users can manage their own domain" ON public.custom_domains FOR ALL USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = custom_domains.company_id AND companies.user_id = auth.uid()));
CREATE POLICY "Super admins can view all domains" ON public.custom_domains FOR SELECT USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update domains" ON public.custom_domains FOR UPDATE USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Deny anonymous access to custom_domains" ON public.custom_domains FOR ALL USING (false) WITH CHECK (false);

-- Verification requests policies
CREATE POLICY "Users can manage their own verification request" ON public.verification_requests FOR ALL USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = verification_requests.company_id AND companies.user_id = auth.uid()));
CREATE POLICY "Super admins can view all verification requests" ON public.verification_requests FOR SELECT USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update verification requests" ON public.verification_requests FOR UPDATE USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Deny anonymous SELECT on verification_requests" ON public.verification_requests FOR SELECT USING (false);

-- Support tickets policies
CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create support tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM companies WHERE companies.id = support_tickets.company_id AND companies.user_id = auth.uid()));
CREATE POLICY "Super admins can view all tickets" ON public.support_tickets FOR SELECT USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update tickets" ON public.support_tickets FOR UPDATE USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Deny anonymous SELECT on support_tickets" ON public.support_tickets FOR SELECT USING (false);

-- Withdrawal requests policies
CREATE POLICY "Users can view their withdrawal requests" ON public.withdrawal_requests FOR SELECT USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = withdrawal_requests.company_id AND companies.user_id = auth.uid()));
CREATE POLICY "Users can create withdrawal requests" ON public.withdrawal_requests FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = withdrawal_requests.company_id AND companies.user_id = auth.uid()));
CREATE POLICY "Super admins can view all withdrawal requests" ON public.withdrawal_requests FOR SELECT USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update withdrawal requests" ON public.withdrawal_requests FOR UPDATE USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Deny anonymous SELECT on withdrawal_requests" ON public.withdrawal_requests FOR SELECT USING (false);

-- Email reverification tokens policies
CREATE POLICY "Users can read own tokens" ON public.email_reverification_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Deny anonymous SELECT on email_reverification_tokens" ON public.email_reverification_tokens FOR SELECT USING (false);

-- Admin activity log policies
CREATE POLICY "Super admins can view activity logs" ON public.admin_activity_log FOR SELECT USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can insert activity logs" ON public.admin_activity_log FOR INSERT WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Admin notifications log policies
CREATE POLICY "Super admins can view notification logs" ON public.admin_notifications_log FOR SELECT USING (has_role(auth.uid(), 'super_admin'));

-- Platform settings policies
CREATE POLICY "Public can read platform settings" ON public.platform_settings FOR SELECT USING (key = ANY (ARRAY['platform_name', 'logo_url', 'social_links', 'footer_info']));
CREATE POLICY "Super admins can manage settings" ON public.platform_settings FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Rate limits policies
CREATE POLICY "Service role can manage rate limits" ON public.rate_limits FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Nigerian locations policies
CREATE POLICY "Anyone can view locations" ON public.nigerian_locations FOR SELECT USING (true);

-- Subscription plans policies
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);

-- Public company profiles policies
CREATE POLICY "Owners can view full company profile" ON public.public_company_profiles FOR SELECT USING (id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- ============================================
-- 9. STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);

-- Storage policies for property-images bucket
CREATE POLICY "Anyone can view property images" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "Authenticated users can upload property images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- ============================================
-- 10. SEED DATA - SUBSCRIPTION PLANS
-- ============================================

INSERT INTO public.subscription_plans (id, name, description, monthly_price, yearly_price, max_properties, features, is_active) VALUES
('starter', 'Starter', 'Perfect for individual agents', 5000, 50000, 5, '["5 property listings", "Basic analytics", "Standard support", "Share links"]'::jsonb, true),
('pro', 'Pro', 'For growing agencies', 15000, 150000, 25, '["25 property listings", "Advanced analytics", "Priority support", "Custom branding", "Short links", "Lead scoring"]'::jsonb, true),
('premium', 'Premium', 'For established businesses', 35000, 350000, NULL, '["Unlimited listings", "Full analytics suite", "24/7 support", "Custom domain", "API access", "White-label solution"]'::jsonb, true);
