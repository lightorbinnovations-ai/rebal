-- =====================================================
-- PROPERTY BOOST/FEATURED PLACEMENT SYSTEM
-- =====================================================

-- Create property_boosts table for paid/requested boost placements
CREATE TABLE public.property_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('paid', 'tier_included', 'requested')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'rejected')),
  boost_score INTEGER NOT NULL DEFAULT 10, -- Additional score on top of tier score
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  amount_paid NUMERIC DEFAULT 0,
  admin_note TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on property_boosts
ALTER TABLE public.property_boosts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_boosts
CREATE POLICY "Users can view their own boosts"
ON public.property_boosts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create boost requests"
ON public.property_boosts FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid()
));

CREATE POLICY "Super admins can view all boosts"
ON public.property_boosts FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all boosts"
ON public.property_boosts FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Deny anonymous SELECT on property_boosts"
ON public.property_boosts FOR SELECT
USING (false);

-- Index for efficient queries
CREATE INDEX idx_property_boosts_active ON public.property_boosts(property_id, status, expires_at)
WHERE status = 'active';

-- =====================================================
-- CUSTOM EMAIL FORWARDING REQUESTS
-- =====================================================

-- Create custom_email_requests table
CREATE TABLE public.custom_email_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES public.custom_domains(id) ON DELETE SET NULL,
  requested_email TEXT NOT NULL, -- e.g., "contact" for contact@domain.com
  forward_to_email TEXT NOT NULL, -- Where emails should be forwarded
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'removed')),
  admin_note TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, requested_email) -- One email prefix per company
);

-- Enable RLS on custom_email_requests
ALTER TABLE public.custom_email_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_email_requests
CREATE POLICY "Users can view their own email requests"
ON public.custom_email_requests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create email requests"
ON public.custom_email_requests FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete their own pending email requests"
ON public.custom_email_requests FOR DELETE
USING (
  status = 'pending' AND
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid())
);

CREATE POLICY "Super admins can view all email requests"
ON public.custom_email_requests FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all email requests"
ON public.custom_email_requests FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Deny anonymous SELECT on custom_email_requests"
ON public.custom_email_requests FOR SELECT
USING (false);

-- =====================================================
-- DOMAIN SETUP REQUESTS (for admin-assisted setup)
-- =====================================================

-- Add help_requested field to custom_domains
ALTER TABLE public.custom_domains 
ADD COLUMN IF NOT EXISTS help_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS help_notes TEXT,
ADD COLUMN IF NOT EXISTS help_requested_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- UPDATE PROPERTY PRIORITY CALCULATION
-- =====================================================

-- Update the priority score function to include boost
CREATE OR REPLACE FUNCTION public.update_property_priority_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_tier TEXT;
  base_score INTEGER := 1;
  boost_score INTEGER := 0;
BEGIN
  -- Get the company's subscription status
  SELECT subscription_status INTO company_tier
  FROM public.companies
  WHERE id = NEW.company_id;
  
  -- Calculate base score from subscription tier
  CASE company_tier
    WHEN 'active' THEN
      SELECT CASE sp.id
        WHEN 'premium' THEN 4
        WHEN 'pro' THEN 3
        WHEN 'starter' THEN 2
        ELSE 1
      END INTO base_score
      FROM public.subscriptions s
      JOIN public.subscription_plans sp ON s.plan_id = sp.id
      WHERE s.company_id = NEW.company_id
      LIMIT 1;
    WHEN 'trialing' THEN base_score := 1;
    ELSE base_score := 1;
  END CASE;
  
  -- Check for active boosts
  SELECT COALESCE(MAX(pb.boost_score), 0) INTO boost_score
  FROM public.property_boosts pb
  WHERE pb.property_id = NEW.id
    AND pb.status = 'active'
    AND (pb.expires_at IS NULL OR pb.expires_at > now());
  
  NEW.priority_score := COALESCE(base_score, 1) + boost_score;
  RETURN NEW;
END;
$$;

-- Function to expire old boosts
CREATE OR REPLACE FUNCTION public.expire_old_boosts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.property_boosts
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Trigger priority recalculation for affected properties
  UPDATE public.properties p
  SET updated_at = now()
  WHERE id IN (
    SELECT DISTINCT property_id 
    FROM public.property_boosts 
    WHERE updated_at > now() - INTERVAL '1 minute'
      AND status = 'expired'
  );
  
  RETURN expired_count;
END;
$$;