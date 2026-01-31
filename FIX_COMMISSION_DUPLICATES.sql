-- Identify duplicates based on created_at timestamp proximity (within 1 minute)
-- This is a safe way to find the double-counted records
WITH duplicates AS (
  SELECT id, 
         referrer_id, 
         referred_id, 
         payment_amount, 
         created_at,
         ROW_NUMBER() OVER (
            PARTITION BY referrer_id, referred_id, payment_amount, date_trunc('minute', created_at)
            ORDER BY created_at DESC
         ) as row_num
  FROM referral_commissions
)
-- Delete the duplicates (keep the one with row_num = 1)
DELETE FROM referral_commissions
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Optional: Verify the deletion
SELECT * FROM referral_commissions ORDER BY created_at DESC LIMIT 10;
