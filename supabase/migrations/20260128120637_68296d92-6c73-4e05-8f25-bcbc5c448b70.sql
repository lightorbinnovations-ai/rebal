-- Add account_type column to companies table to distinguish affiliates from realtors
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'realtor' CHECK (account_type IN ('realtor', 'affiliate'));

-- Add comment for documentation
COMMENT ON COLUMN public.companies.account_type IS 'Type of account: realtor (full features) or affiliate (referrals only)';