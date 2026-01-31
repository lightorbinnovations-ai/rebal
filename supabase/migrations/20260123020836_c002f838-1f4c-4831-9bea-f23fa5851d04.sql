-- Update the set_trial_end_date function to set max_properties to 1 instead of 3
CREATE OR REPLACE FUNCTION public.set_trial_end_date()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.subscription_status := 'trialing';
  NEW.subscription_end_date := NEW.created_at + INTERVAL '14 days';
  NEW.max_properties := 1;  -- Changed from 3 to 1
  RETURN NEW;
END;
$function$;