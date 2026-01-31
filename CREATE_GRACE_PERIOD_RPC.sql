-- FUNCTION: expire_grace_periods
-- This function is called by the check-grace-periods Edge Function.
-- It finds subscriptions that are past_due and strictly past their grace_period_end.

CREATE OR REPLACE FUNCTION public.expire_grace_periods()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_sub RECORD;
  count_processed INTEGER := 0;
  company_user_id UUID;
BEGIN
  -- Loop through all expired subscriptions
  FOR expired_sub IN 
    SELECT s.id, s.company_id, c.user_id, c.name as company_name
    FROM subscriptions s
    JOIN companies c ON s.company_id = c.id
    WHERE s.status = 'past_due' 
    AND s.grace_period_end IS NOT NULL
    AND s.grace_period_end < now()
  LOOP
    -- 1. Cancel the subscription
    UPDATE subscriptions
    SET 
      status = 'cancelled',
      cancel_at_period_end = false,
      updated_at = now()
    WHERE id = expired_sub.id;

    -- 2. Downgrade the company to free limits
    UPDATE companies
    SET 
      subscription_status = 'cancelled',
      max_properties = 1, -- Revert to free/trial limit
      updated_at = now()
    WHERE id = expired_sub.company_id;

    -- 3. Notify the user
    INSERT INTO notifications (
      user_id, 
      company_id, 
      type, 
      title, 
      message, 
      metadata
    ) VALUES (
      expired_sub.user_id, 
      expired_sub.company_id, 
      'subscription_cancelled',
      'Subscription Cancelled',
      'Your subscription grace period has ended and your plan has been cancelled. You have been downgraded to the free plan limits.',
      jsonb_build_object('subscription_id', expired_sub.id, 'reason', 'grace_period_expired')
    );

    count_processed := count_processed + 1;
  END LOOP;

  RETURN count_processed;
END;
$$;
