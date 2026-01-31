-- Set trial end date for new companies (14 days from creation)
CREATE OR REPLACE FUNCTION public.set_trial_end_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.subscription_status := 'trialing';
  NEW.subscription_end_date := NEW.created_at + INTERVAL '14 days';
  NEW.max_properties := 3;
  RETURN NEW;
END;
$$;

-- Create trigger for new companies
DROP TRIGGER IF EXISTS trigger_set_trial_end ON public.companies;
CREATE TRIGGER trigger_set_trial_end
BEFORE INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.set_trial_end_date();

-- Update existing companies to have trial info if they don't have subscription
UPDATE public.companies
SET 
  subscription_status = 'trialing',
  subscription_end_date = created_at + INTERVAL '14 days',
  max_properties = 3
WHERE subscription_status IS NULL OR subscription_end_date IS NULL;