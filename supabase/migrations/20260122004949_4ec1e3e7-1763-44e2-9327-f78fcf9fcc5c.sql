-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('inquiry', 'payment', 'subscription', 'referral', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage notifications" 
ON public.notifications 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);

-- Add subscription_status to companies for quick access
ALTER TABLE public.companies 
ADD COLUMN subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'cancelled', 'expired', 'past_due')),
ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN max_properties INTEGER DEFAULT 3;

-- Function to check if company subscription is active
CREATE OR REPLACE FUNCTION public.is_subscription_active(company_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT 
      CASE 
        WHEN subscription_status = 'active' THEN true
        WHEN subscription_status = 'trialing' AND subscription_end_date > now() THEN true
        ELSE false
      END
    FROM public.companies WHERE id = company_uuid),
    false
  )
$$;

-- Update RLS policy for properties to hide expired trial properties from public
DROP POLICY IF EXISTS "Public can view active properties" ON public.properties;

CREATE POLICY "Public can view active properties with valid subscription" 
ON public.properties 
FOR SELECT 
USING (
  is_active = true 
  AND public.is_subscription_active(company_id)
);