-- Create table to track individual referral commission transactions
CREATE TABLE public.referral_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  payment_amount NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 0.10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own commission history (as referrer)
CREATE POLICY "Users can view their commission history"
ON public.referral_commissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = referral_commissions.referrer_id
    AND companies.user_id = auth.uid()
  )
);

-- Service role can insert commissions
CREATE POLICY "Service role can manage commissions"
ON public.referral_commissions
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX idx_referral_commissions_referrer ON public.referral_commissions(referrer_id);
CREATE INDEX idx_referral_commissions_created ON public.referral_commissions(created_at DESC);