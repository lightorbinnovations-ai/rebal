-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  admin_note TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawal requests
CREATE POLICY "Users can view their withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM companies
  WHERE companies.id = withdrawal_requests.company_id
  AND companies.user_id = auth.uid()
));

-- Users can create withdrawal requests for their company
CREATE POLICY "Users can create withdrawal requests"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM companies
  WHERE companies.id = withdrawal_requests.company_id
  AND companies.user_id = auth.uid()
));

-- Super admins can view all withdrawal requests
CREATE POLICY "Super admins can view all withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

-- Super admins can update withdrawal requests
CREATE POLICY "Super admins can update withdrawal requests"
ON public.withdrawal_requests
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'));

-- Trigger for updated_at
CREATE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to notify user on withdrawal request status change
CREATE OR REPLACE FUNCTION public.notify_on_withdrawal_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_user_id UUID;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  IF NEW.status != OLD.status THEN
    SELECT user_id INTO company_user_id FROM companies WHERE id = NEW.company_id;
    
    CASE NEW.status
      WHEN 'processing' THEN
        notification_title := 'Withdrawal Being Processed';
        notification_message := 'Your withdrawal request of ₦' || NEW.amount || ' is being processed.';
      WHEN 'completed' THEN
        notification_title := 'Withdrawal Completed';
        notification_message := 'Your withdrawal of ₦' || NEW.amount || ' has been sent to your bank account.';
      WHEN 'rejected' THEN
        notification_title := 'Withdrawal Rejected';
        notification_message := 'Your withdrawal request of ₦' || NEW.amount || ' was rejected. ' || COALESCE(NEW.admin_note, '');
      ELSE
        RETURN NEW;
    END CASE;
    
    INSERT INTO notifications (user_id, company_id, type, title, message, metadata)
    VALUES (company_user_id, NEW.company_id, 'system', notification_title, notification_message, 
      jsonb_build_object('withdrawal_id', NEW.id, 'amount', NEW.amount, 'status', NEW.status));
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for withdrawal status notifications
CREATE TRIGGER notify_withdrawal_status_change
AFTER UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_withdrawal_status();