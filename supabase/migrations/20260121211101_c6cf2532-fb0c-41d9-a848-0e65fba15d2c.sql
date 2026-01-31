-- Add referral-related columns to companies table
ALTER TABLE public.companies
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by UUID REFERENCES public.companies(id),
ADD COLUMN wallet_balance NUMERIC DEFAULT 0;

-- Create referrals tracking table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid')),
  reward_amount NUMERIC NOT NULL DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their referrals"
ON public.referrals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE (companies.id = referrals.referrer_id OR companies.id = referrals.referred_id)
    AND companies.user_id = auth.uid()
  )
);

-- Function to generate referral code from company slug
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

-- Trigger to auto-generate referral code on company creation
CREATE TRIGGER generate_company_referral_code
BEFORE INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Function to process referral when company signs up with referral code
CREATE OR REPLACE FUNCTION public.process_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_company_id UUID;
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    -- Create referral record
    INSERT INTO public.referrals (referrer_id, referred_id, status, reward_amount)
    VALUES (NEW.referred_by, NEW.id, 'pending', 500);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to process referral on company creation
CREATE TRIGGER process_company_referral
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.process_referral();