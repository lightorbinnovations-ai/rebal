-- Add grace period fields to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS grace_period_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS failed_payment_count integer DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.subscriptions.grace_period_end IS 'End date of grace period after failed payment';
COMMENT ON COLUMN public.subscriptions.failed_payment_count IS 'Number of consecutive failed payment attempts';

-- Create function to expire grace periods (can be called by a cron job or edge function)
CREATE OR REPLACE FUNCTION public.expire_grace_periods()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expired_count integer := 0;
  expired_sub RECORD;
BEGIN
  -- Find all subscriptions with expired grace periods
  FOR expired_sub IN 
    SELECT s.id, s.company_id, s.paystack_subscription_code
    FROM subscriptions s
    WHERE s.status = 'past_due'
      AND s.grace_period_end IS NOT NULL
      AND s.grace_period_end < now()
  LOOP
    -- Update subscription to cancelled
    UPDATE subscriptions
    SET status = 'cancelled',
        grace_period_end = NULL,
        failed_payment_count = 0,
        updated_at = now()
    WHERE id = expired_sub.id;

    -- Downgrade company to trial limits
    UPDATE companies
    SET subscription_status = 'cancelled',
        subscription_end_date = now(),
        max_properties = 3,
        updated_at = now()
    WHERE id = expired_sub.company_id;

    -- Create notification for user
    INSERT INTO notifications (user_id, company_id, type, title, message, metadata)
    SELECT 
      c.user_id,
      c.id,
      'subscription',
      'Subscription Downgraded',
      'Your subscription has been downgraded due to payment failure. Please update your payment method to restore full access.',
      jsonb_build_object('subscription_id', expired_sub.id, 'reason', 'grace_period_expired')
    FROM companies c
    WHERE c.id = expired_sub.company_id;

    expired_count := expired_count + 1;
  END LOOP;

  RETURN expired_count;
END;
$$;

-- Create index for efficient grace period queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_grace_period 
ON public.subscriptions (status, grace_period_end) 
WHERE status = 'past_due' AND grace_period_end IS NOT NULL;