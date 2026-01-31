-- 1. Add the column if it doesn't exist
ALTER TABLE referral_commissions 
ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- 2. Populate existing records (Optional, best effort matching)
-- This tries to link recent commissions to payments if possible, but for future robustness the constraint is key.
-- We can skip backfilling for now as the goal is preventing FUTURE duplicates.

-- 3. Add the UNIQUE constraint
-- This effectively blocks any duplicate commission for the same payment reference
CREATE UNIQUE INDEX IF NOT EXISTS referral_commissions_payment_reference_key 
ON referral_commissions(payment_reference);
