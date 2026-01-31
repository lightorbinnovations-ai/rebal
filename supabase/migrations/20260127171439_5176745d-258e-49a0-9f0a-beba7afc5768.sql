-- Add bank details columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.companies.bank_name IS 'User''s bank name for withdrawals';
COMMENT ON COLUMN public.companies.bank_account_number IS 'User''s bank account number for withdrawals';
COMMENT ON COLUMN public.companies.bank_account_name IS 'User''s bank account holder name for withdrawals';