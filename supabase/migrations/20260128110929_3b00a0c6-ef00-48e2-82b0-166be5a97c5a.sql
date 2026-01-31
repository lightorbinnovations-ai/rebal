-- Update the priority score function to give Business tier highest priority
-- Business = 20 (always at top, higher than any boosted lower tier)
-- Premium = 4, Pro = 3, Starter = 2, Trial/Free = 1
-- Boost adds +10, so max boosted non-business = 14

CREATE OR REPLACE FUNCTION public.update_property_priority_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  company_tier TEXT;
  plan_id_val TEXT;
  base_score INTEGER := 1;
  boost_score INTEGER := 0;
BEGIN
  -- Get the company's subscription status
  SELECT subscription_status INTO company_tier
  FROM public.companies
  WHERE id = NEW.company_id;
  
  -- Calculate base score from subscription tier
  IF company_tier = 'active' THEN
    SELECT sp.id INTO plan_id_val
    FROM public.subscriptions s
    JOIN public.subscription_plans sp ON s.plan_id = sp.id
    WHERE s.company_id = NEW.company_id
    LIMIT 1;
    
    -- Business tier gets highest priority (20) - always at top
    -- This ensures Business properties appear above any boosted lower tier
    CASE plan_id_val
      WHEN 'business' THEN base_score := 20;
      WHEN 'premium' THEN base_score := 4;
      WHEN 'pro' THEN base_score := 3;
      WHEN 'starter' THEN base_score := 2;
      ELSE base_score := 1;
    END CASE;
  ELSIF company_tier = 'trialing' THEN 
    base_score := 1;
  ELSE 
    base_score := 1;
  END IF;
  
  -- Check for active boosts (only add boost score for non-business tiers)
  -- Business tier doesn't need boosts - they're already at the top
  IF plan_id_val != 'business' OR plan_id_val IS NULL THEN
    SELECT COALESCE(MAX(pb.boost_score), 0) INTO boost_score
    FROM public.property_boosts pb
    WHERE pb.property_id = NEW.id
      AND pb.status = 'active'
      AND (pb.expires_at IS NULL OR pb.expires_at > now());
  END IF;
  
  NEW.priority_score := COALESCE(base_score, 1) + boost_score;
  RETURN NEW;
END;
$function$;

-- Recalculate priority scores for all existing properties
UPDATE public.properties SET updated_at = now();