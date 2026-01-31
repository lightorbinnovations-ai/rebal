-- 1. Add rate limiting function for lead tracking inserts
CREATE OR REPLACE FUNCTION public.check_lead_tracking_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
  client_ip text;
BEGIN
  -- Get session identifier for rate limiting (session_id serves as client identifier)
  -- Limit: max 10 new sessions per IP per hour
  SELECT COUNT(*) INTO recent_count
  FROM public.lead_tracking
  WHERE session_id LIKE 'session_%'
    AND created_at > NOW() - INTERVAL '1 hour'
    AND SUBSTRING(session_id, 1, 30) = SUBSTRING(NEW.session_id, 1, 30);
  
  -- If same session prefix is creating too many records, block
  IF recent_count >= 100 THEN
    RAISE EXCEPTION 'Rate limit exceeded for lead tracking';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for rate limiting on insert
DROP TRIGGER IF EXISTS check_lead_tracking_rate ON public.lead_tracking;
CREATE TRIGGER check_lead_tracking_rate
  BEFORE INSERT ON public.lead_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.check_lead_tracking_rate_limit();

-- 2. Add function to validate session ownership on update
CREATE OR REPLACE FUNCTION public.validate_lead_tracking_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  time_increment integer;
  page_increment integer;
BEGIN
  -- Calculate increments
  time_increment := NEW.time_spent_seconds - COALESCE(OLD.time_spent_seconds, 0);
  page_increment := NEW.page_views - COALESCE(OLD.page_views, 0);
  
  -- Prevent unrealistic time updates (max 1 hour per single update)
  IF time_increment > 3600 THEN
    RAISE EXCEPTION 'Invalid time update: exceeds maximum allowed increment of 1 hour';
  END IF;
  
  -- Prevent negative values
  IF NEW.time_spent_seconds < 0 OR NEW.page_views < 0 THEN
    RAISE EXCEPTION 'Negative values not allowed for tracking metrics';
  END IF;
  
  -- Prevent unrealistic page view jumps (max 20 pages per update)
  IF page_increment > 20 THEN
    RAISE EXCEPTION 'Invalid page views update: exceeds maximum allowed increment';
  END IF;
  
  -- Prevent updates to sessions older than 24 hours
  IF OLD.created_at < NOW() - INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'Cannot update expired tracking session';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for update validation (replace old one if exists)
DROP TRIGGER IF EXISTS validate_tracking_update ON public.lead_tracking;
CREATE TRIGGER validate_tracking_update
  BEFORE UPDATE ON public.lead_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_tracking_update();

-- 3. Create notification function for referral payments
CREATE OR REPLACE FUNCTION public.notify_referrer_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_user_id UUID;
  referred_name TEXT;
  commission_earned NUMERIC;
BEGIN
  -- Only trigger when status changes to 'completed' and reward increases
  IF NEW.status = 'completed' AND 
     (OLD.status = 'pending' OR (OLD.reward_amount IS DISTINCT FROM NEW.reward_amount AND NEW.reward_amount > OLD.reward_amount)) THEN
    
    -- Get the referrer's user_id
    SELECT user_id INTO referrer_user_id 
    FROM public.companies 
    WHERE id = NEW.referrer_id;
    
    -- Get referred company name
    SELECT name INTO referred_name 
    FROM public.companies 
    WHERE id = NEW.referred_id;
    
    -- Calculate commission earned (difference from previous)
    commission_earned := NEW.reward_amount - COALESCE(OLD.reward_amount, 0);
    
    -- Only notify if there's actual commission earned
    IF commission_earned > 0 THEN
      INSERT INTO public.notifications (user_id, company_id, type, title, message, metadata)
      VALUES (
        referrer_user_id,
        NEW.referrer_id,
        'referral',
        '💰 Commission Earned!',
        referred_name || ' made a payment! You earned ₦' || commission_earned || ' commission (10% of their subscription).',
        jsonb_build_object(
          'referral_id', NEW.id, 
          'commission', commission_earned,
          'referred_company', referred_name,
          'total_earnings', NEW.reward_amount
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for referral payment notifications
DROP TRIGGER IF EXISTS notify_referrer_payment ON public.referrals;
CREATE TRIGGER notify_referrer_payment
  AFTER UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_referrer_on_payment();