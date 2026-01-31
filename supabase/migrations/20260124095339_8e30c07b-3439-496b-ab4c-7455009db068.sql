-- Create table to track referral visits (before signup)
CREATE TABLE public.referral_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  visitor_fingerprint TEXT, -- browser fingerprint or IP hash for deduplication
  ip_address TEXT,
  user_agent TEXT,
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE, -- set when visitor signs up
  converted_company_id UUID REFERENCES public.companies(id)
);

-- Create index for fast lookups by referral code and fingerprint
CREATE INDEX idx_referral_visits_code ON public.referral_visits(referral_code);
CREATE INDEX idx_referral_visits_fingerprint ON public.referral_visits(referral_code, visitor_fingerprint);
CREATE INDEX idx_referral_visits_created ON public.referral_visits(created_at DESC);

-- Enable RLS
ALTER TABLE public.referral_visits ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can insert (via edge function)
-- No direct user access needed - all access via edge functions
CREATE POLICY "Service role full access on referral_visits"
  ON public.referral_visits
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create referral_events table for audit trail
CREATE TABLE public.referral_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'visit', 'signup', 'conversion', 'reward_pending', 'reward_paid'
  referral_code TEXT NOT NULL,
  referrer_company_id UUID REFERENCES public.companies(id),
  referred_company_id UUID REFERENCES public.companies(id),
  visitor_fingerprint TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for referral events
CREATE INDEX idx_referral_events_code ON public.referral_events(referral_code);
CREATE INDEX idx_referral_events_referrer ON public.referral_events(referrer_company_id);
CREATE INDEX idx_referral_events_type ON public.referral_events(event_type);
CREATE INDEX idx_referral_events_created ON public.referral_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

-- Referrer can view their own referral events
CREATE POLICY "Referrers can view their own events"
  ON public.referral_events
  FOR SELECT
  USING (
    referrer_company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- Service role for inserts (via edge functions)
CREATE POLICY "Service role can insert events"
  ON public.referral_events
  FOR INSERT
  WITH CHECK (false);