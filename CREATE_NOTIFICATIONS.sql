-- MASTER NOTIFICATION SYSTEM
-- "Core Rule": Every user action must trigger a notification.
-- Implements Point 10 of the Master System Audit.

-- 1. Ensure Notification Table Exists & Has Correct Schema
CREATE TABLE IF NOT EXISTS public.admin_notifications_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL, -- e.g., 'new_user', 'new_property', 'inquiry'
    message text NOT NULL,
    reference_id uuid, -- Link to the related record (property_id, user_id, etc.)
    created_at timestamptz DEFAULT now(),
    read boolean DEFAULT false,
    priority text DEFAULT 'normal' -- 'high', 'normal'
);

-- Enable RLS
ALTER TABLE public.admin_notifications_log ENABLE ROW LEVEL SECURITY;

-- Allow Admins to View/Update
DROP POLICY IF EXISTS "Admins can view notifications" ON public.admin_notifications_log;
CREATE POLICY "Admins can view notifications"
ON public.admin_notifications_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role::text IN ('super_admin', 'moderator', 'admin')
  )
);

-- Allow System (Service Role) to Inset
-- Note: Triggers run with the privileges of the function definer if SECURITY DEFINER is set

-- =========================================================
-- UNIVERSAL NOTIFICATION FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION public.trigger_admin_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_type text := TG_ARGV[0];
    v_message text := TG_ARGV[1];
    v_priority text := 'normal';
    v_ref_id uuid;
    v_user_email text;
BEGIN
    -- Dynamic Logic based on Type

    -- A. New User / Company
    IF v_type = 'new_user' THEN
        v_ref_id := NEW.id;
        v_message := 'New Company Registered: ' || NEW.company_name;
    
    -- B. New Property
    ELSIF v_type = 'new_property' THEN
        v_ref_id := NEW.id;
        v_message := 'New Property Created: ' || NEW.title;
        
    -- C. Property Published
    ELSIF v_type = 'property_published' THEN
        -- Only trigger if status changed to published
        IF OLD.status != 'published' AND NEW.status = 'published' THEN
             v_ref_id := NEW.id;
             v_message := 'Property Published: ' || NEW.title;
        ELSE
             RETURN NEW; -- Skip if not a publish event
        END IF;

    -- D. Inquiry
    ELSIF v_type = 'inquiry' THEN
        v_ref_id := NEW.id;
        v_message := 'New Inquiry from ' || NEW.name;
        v_priority := 'high';

    -- E. Support Ticket
    ELSIF v_type = 'support' THEN
        v_ref_id := NEW.id;
        v_message := 'Support Ticket: ' || NEW.subject;
        IF NEW.priority = 'high' THEN v_priority := 'high'; END IF;

    -- F. Subscription
    ELSIF v_type = 'subscription' THEN
        v_ref_id := NEW.id;
        v_message := 'New Subscription: ' || NEW.plan_id; 

    -- G. Verification Request
    ELSIF v_type = 'verification' THEN
        v_ref_id := NEW.id;
        v_message := 'Verification Request Submitted';
        v_priority := 'high';

    -- H. Withdrawal Request
    ELSIF v_type = 'withdrawal' THEN
        v_ref_id := NEW.id;
        v_message := 'Withdrawal Request: ₦' || NEW.amount::text;
        v_priority := 'high';

    -- I. Domain Request
    ELSIF v_type = 'domain' THEN
        v_ref_id := NEW.id;
        v_message := 'Domain Request: ' || COALESCE(NEW.business_name, 'New Domain');
        v_priority := 'normal';

    -- J. Referral
    ELSIF v_type = 'referral' THEN
        v_ref_id := NEW.id;
        v_message := 'New Referral Signup';

    -- K. Property Boost
    ELSIF v_type = 'boost' THEN
        v_ref_id := NEW.id;
        v_message := 'Property Boost Payment: ₦' || COALESCE(NEW.amount_paid::text, '0');

    END IF;

    -- INSERT NOTIFICATION
    INSERT INTO public.admin_notifications_log (type, message, reference_id, priority)
    VALUES (v_type, v_message, v_ref_id, v_priority);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- ATTACH TRIGGERS
-- =========================================================

-- 1. New Company (Onboarding)
DROP TRIGGER IF EXISTS on_new_company ON public.companies;
CREATE TRIGGER on_new_company
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('new_user', 'New User');

-- 2. New Property
DROP TRIGGER IF EXISTS on_new_property ON public.properties;
CREATE TRIGGER on_new_property
AFTER INSERT ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('new_property', 'New Property');

-- 3. Property Published (Update)
DROP TRIGGER IF EXISTS on_property_publish ON public.properties;
CREATE TRIGGER on_property_publish
AFTER UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('property_published', 'Property Published');

-- 4. Inquiries (Contact Messages)
DROP TRIGGER IF EXISTS on_new_inquiry ON public.contact_messages;
CREATE TRIGGER on_new_inquiry
AFTER INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('inquiry', 'New Inquiry');

-- 5. Support Tickets
DROP TRIGGER IF EXISTS on_new_ticket ON public.support_tickets;
CREATE TRIGGER on_new_ticket
AFTER INSERT ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('support', 'New Ticket');

-- 6. Subscriptions
DROP TRIGGER IF EXISTS on_new_sub ON public.subscriptions;
CREATE TRIGGER on_new_sub
AFTER INSERT ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('subscription', 'New Subscription');

-- 7. Verification Requests
DROP TRIGGER IF EXISTS on_new_verification ON public.verification_requests;
CREATE TRIGGER on_new_verification
AFTER INSERT ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('verification', 'Verification Request');

-- 8. Withdrawal Requests
DROP TRIGGER IF EXISTS on_new_withdrawal ON public.withdrawal_requests;
CREATE TRIGGER on_new_withdrawal
AFTER INSERT ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('withdrawal', 'Withdrawal Request');

-- 9. Domain Requests
DROP TRIGGER IF EXISTS on_new_domain ON public.domain_requests;
CREATE TRIGGER on_new_domain
AFTER INSERT ON public.domain_requests
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('domain', 'Domain Request');

-- 10. Referrals
DROP TRIGGER IF EXISTS on_new_referral ON public.referrals;
CREATE TRIGGER on_new_referral
AFTER INSERT ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('referral', 'Referral');

-- 11. Property Boosts
DROP TRIGGER IF EXISTS on_new_boost ON public.property_boosts;
CREATE TRIGGER on_new_boost
AFTER INSERT ON public.property_boosts
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('boost', 'Property Boost');

