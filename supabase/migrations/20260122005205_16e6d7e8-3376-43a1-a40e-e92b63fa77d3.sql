-- Create function to create notifications on inquiry insert
CREATE OR REPLACE FUNCTION public.notify_on_inquiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_user_id UUID;
  property_title TEXT;
BEGIN
  -- Get the company owner's user_id
  SELECT user_id INTO company_user_id FROM public.companies WHERE id = NEW.company_id;
  
  -- Get property title if applicable
  IF NEW.property_id IS NOT NULL THEN
    SELECT title INTO property_title FROM public.properties WHERE id = NEW.property_id;
  END IF;
  
  -- Insert notification
  INSERT INTO public.notifications (user_id, company_id, type, title, message, metadata)
  VALUES (
    company_user_id,
    NEW.company_id,
    'inquiry',
    'New Inquiry Received',
    COALESCE('New inquiry from ' || NEW.name || ' about ' || property_title, 'New inquiry from ' || NEW.name),
    jsonb_build_object('inquiry_id', NEW.id, 'property_id', NEW.property_id, 'customer_name', NEW.name)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for inquiries
DROP TRIGGER IF EXISTS trigger_notify_inquiry ON public.inquiries;
CREATE TRIGGER trigger_notify_inquiry
AFTER INSERT ON public.inquiries
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_inquiry();

-- Create function to notify on payment success
CREATE OR REPLACE FUNCTION public.notify_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_user_id UUID;
  plan_name TEXT;
BEGIN
  IF NEW.status = 'success' AND (OLD IS NULL OR OLD.status != 'success') THEN
    -- Get the company owner's user_id
    SELECT user_id INTO company_user_id FROM public.companies WHERE id = NEW.company_id;
    
    -- Get plan name from metadata
    plan_name := COALESCE(NEW.metadata->>'plan_name', 'subscription');
    
    -- Insert notification
    INSERT INTO public.notifications (user_id, company_id, type, title, message, metadata)
    VALUES (
      company_user_id,
      NEW.company_id,
      'payment',
      'Payment Successful',
      'Your payment of ₦' || NEW.amount || ' for ' || plan_name || ' has been processed successfully.',
      jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payments
DROP TRIGGER IF EXISTS trigger_notify_payment ON public.payments;
CREATE TRIGGER trigger_notify_payment
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_payment();

-- Create function to notify on referral
CREATE OR REPLACE FUNCTION public.notify_on_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_user_id UUID;
  referred_name TEXT;
BEGIN
  -- Get the referrer's user_id
  SELECT user_id INTO referrer_user_id FROM public.companies WHERE id = NEW.referrer_id;
  
  -- Get referred company name
  SELECT name INTO referred_name FROM public.companies WHERE id = NEW.referred_id;
  
  -- Insert notification
  INSERT INTO public.notifications (user_id, company_id, type, title, message, metadata)
  VALUES (
    referrer_user_id,
    NEW.referrer_id,
    'referral',
    'New Referral Bonus!',
    COALESCE(referred_name, 'A new agent') || ' signed up using your referral code. You earned ₦' || NEW.reward_amount || '!',
    jsonb_build_object('referral_id', NEW.id, 'reward_amount', NEW.reward_amount)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for referrals
DROP TRIGGER IF EXISTS trigger_notify_referral ON public.referrals;
CREATE TRIGGER trigger_notify_referral
AFTER INSERT ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_referral();

-- Allow super admins to view all referrals
CREATE POLICY "Super admins can view all referrals" 
ON public.referrals 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow super admins to update referrals (for payouts)
CREATE POLICY "Super admins can update referrals" 
ON public.referrals 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow super admins to view all payments  
CREATE POLICY "Super admins can view all payments" 
ON public.payments 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow super admins to view all subscriptions
CREATE POLICY "Super admins can view all subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));