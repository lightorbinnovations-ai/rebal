-- ============================================
-- DOMAIN REQUESTS TABLE - Platform-managed domains
-- ============================================

-- Create domain_requests table for the new flow
CREATE TABLE IF NOT EXISTS public.domain_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- User input
  business_name TEXT NOT NULL,
  
  -- Selected domain
  selected_domain TEXT, -- The domain user selected (e.g., mybusiness.com)
  selected_extension TEXT, -- .com, .ng, .co, .com.ng
  
  -- Pricing (set by admin)
  domain_price NUMERIC DEFAULT 0,
  email_price NUMERIC DEFAULT 0, -- Optional custom email add-on
  total_price NUMERIC DEFAULT 0,
  
  -- Request status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',           -- User submitted, waiting for admin
    'price_sent',        -- Admin set price, waiting for payment
    'paid',              -- User paid, waiting for admin to purchase
    'processing',        -- Admin is purchasing/configuring
    'active',            -- Domain is live
    'rejected',          -- Request rejected by admin
    'cancelled'          -- Cancelled by user or admin
  )),
  
  -- Admin fields
  admin_note TEXT,
  processed_by UUID,
  price_set_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  
  -- Payment reference
  payment_reference TEXT,
  
  -- Optional email forwarding (if requested)
  email_prefix TEXT, -- e.g., "contact" for contact@domain.com
  forward_to_email TEXT,
  email_status TEXT DEFAULT 'none' CHECK (email_status IN ('none', 'pending', 'active', 'suspended')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.domain_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own domain requests"
ON public.domain_requests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create domain requests"
ON public.domain_requests FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update their pending requests"
ON public.domain_requests FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid())
  AND status IN ('pending', 'price_sent')
);

CREATE POLICY "Super admins can view all domain requests"
ON public.domain_requests FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update all domain requests"
ON public.domain_requests FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete domain requests"
ON public.domain_requests FOR DELETE
USING (has_role(auth.uid(), 'super_admin'));

-- Add updated_at trigger
CREATE TRIGGER update_domain_requests_updated_at
BEFORE UPDATE ON public.domain_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- DEFAULT DOMAIN PRICING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.domain_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension TEXT NOT NULL UNIQUE, -- .com, .ng, .co, .com.ng
  yearly_price NUMERIC NOT NULL DEFAULT 15000,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.domain_pricing ENABLE ROW LEVEL SECURITY;

-- Everyone can read pricing
CREATE POLICY "Anyone can view domain pricing"
ON public.domain_pricing FOR SELECT
USING (true);

-- Only admins can modify pricing
CREATE POLICY "Super admins can manage domain pricing"
ON public.domain_pricing FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Insert default pricing
INSERT INTO public.domain_pricing (extension, yearly_price, is_available) VALUES
  ('.com', 15000, true),
  ('.com.ng', 8000, true),
  ('.ng', 12000, true),
  ('.co', 20000, true)
ON CONFLICT (extension) DO NOTHING;

-- ============================================
-- API KEYS TABLE - Business plan only
-- ============================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  api_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view their own API key
CREATE POLICY "Users can view their own API key"
ON public.api_keys FOR SELECT
USING (EXISTS (
  SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid()
));

-- Super admins can manage all API keys
CREATE POLICY "Super admins can manage API keys"
ON public.api_keys FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Function to generate API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := 'rebal_';
  i INTEGER;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to create API key for Business plan users
CREATE OR REPLACE FUNCTION public.create_api_key_for_company(p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_plan TEXT;
  v_api_key TEXT;
BEGIN
  -- Check if company is on Business plan
  SELECT s.plan_id INTO v_subscription_plan
  FROM subscriptions s
  WHERE s.company_id = p_company_id AND s.status = 'active';
  
  IF v_subscription_plan != 'business' THEN
    RAISE EXCEPTION 'API access is only available for Business plan subscribers';
  END IF;
  
  -- Generate and insert API key
  v_api_key := generate_api_key();
  
  INSERT INTO api_keys (company_id, api_key)
  VALUES (p_company_id, v_api_key)
  ON CONFLICT (company_id) DO UPDATE SET
    api_key = v_api_key,
    is_active = true,
    updated_at = now();
  
  RETURN v_api_key;
END;
$$;