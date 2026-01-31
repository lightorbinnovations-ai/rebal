-- Function to add commission to referrer's wallet
CREATE OR REPLACE FUNCTION add_to_wallet(p_company_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE companies 
  SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount
  WHERE id = p_company_id;
END;
$$;

-- Function to add referral commission (handles recurring payments)
CREATE OR REPLACE FUNCTION add_referral_commission(
  p_referrer_id uuid, 
  p_referred_id uuid, 
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE referrals 
  SET reward_amount = COALESCE(reward_amount, 0) + p_amount,
      status = 'completed'
  WHERE referrer_id = p_referrer_id 
    AND referred_id = p_referred_id;
END;
$$;