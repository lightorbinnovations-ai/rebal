-- ==============================================================================
-- MASTER ADMIN NOTIFICATIONS TRIGGER SETUP (PRODUCTION READY)
-- ==============================================================================
-- This script consolidates all notification logic into one robust system.
-- It fixes the "company_name" bug and ensures all table triggers are correctly attached.
-- ==============================================================================

-- 1. CLEANUP: Drop potential duplicate/conflicting functions and triggers
DROP TRIGGER IF EXISTS on_new_company ON public.companies;
DROP TRIGGER IF EXISTS on_new_property ON public.properties;
DROP TRIGGER IF EXISTS on_property_publish ON public.properties;
DROP TRIGGER IF EXISTS on_new_inquiry ON public.contact_messages;
DROP TRIGGER IF EXISTS trigger_admin_notification_contact ON public.contact_messages;
DROP TRIGGER IF EXISTS on_new_ticket ON public.support_tickets;
DROP TRIGGER IF EXISTS on_new_sub ON public.subscriptions;
DROP TRIGGER IF EXISTS on_new_verification ON public.verification_requests;
DROP TRIGGER IF EXISTS trigger_admin_notification_verification ON public.verification_requests;
DROP TRIGGER IF EXISTS on_new_withdrawal ON public.withdrawal_requests;
DROP TRIGGER IF EXISTS on_new_domain ON public.domain_requests;
DROP TRIGGER IF EXISTS on_new_referral ON public.referrals;
DROP TRIGGER IF EXISTS on_new_boost ON public.property_boosts;

-- cleanup functions
DROP FUNCTION IF EXISTS public.trigger_admin_notification() CASCADE;
DROP FUNCTION IF EXISTS public.handle_admin_notification_trigger() CASCADE;


-- 2. CREATE THE MASTER NOTIFICATION LOG TABLE (Idempotent)
CREATE TABLE IF NOT EXISTS public.admin_notifications_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL,        -- e.g., 'new_user', 'new_property'
    subject text NOT NULL,     -- The main title/message
    recipient text NOT NULL DEFAULT 'admin',
    message text,              -- Optional detailed body
    reference_id uuid,         -- ID of the related record
    metadata jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- 2.1 SCHEMA MIGRATION: Ensure columns exist if table was already created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_notifications_log' AND column_name = 'message') THEN
        ALTER TABLE public.admin_notifications_log ADD COLUMN message text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_notifications_log' AND column_name = 'reference_id') THEN
        ALTER TABLE public.admin_notifications_log ADD COLUMN reference_id uuid;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_notifications_log' AND column_name = 'is_read') THEN
        ALTER TABLE public.admin_notifications_log ADD COLUMN is_read boolean DEFAULT false;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.admin_notifications_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view/update
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.admin_notifications_log;
CREATE POLICY "Admins can manage notifications"
ON public.admin_notifications_log
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role::text IN ('super_admin', 'moderator', 'admin')
  )
);


-- 3. DEFINE THE MASTER TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.trigger_admin_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with admin privileges to insert into log
AS $$
DECLARE
    v_type text := TG_ARGV[0];
    v_subject text := '';
    v_metadata jsonb := '{}';
BEGIN
    -- A. New User / Company
    IF v_type = 'new_user' THEN
        -- FIXED: Used to be NEW.company_name, corrected to NEW.name
        v_subject := 'New Company Registered: ' || COALESCE(NEW.name, 'Unknown');
        v_metadata := jsonb_build_object('company_id', NEW.id);
    
    -- B. New Property
    ELSIF v_type = 'new_property' THEN
        v_subject := 'New Property Created: ' || COALESCE(NEW.title, 'Untitled');
        v_metadata := jsonb_build_object('property_id', NEW.id);
        
    -- C. Property Published
    ELSIF v_type = 'property_published' THEN
        IF OLD.status != 'published' AND NEW.status = 'published' THEN
            v_subject := 'Property Published: ' || COALESCE(NEW.title, 'Untitled');
            v_metadata := jsonb_build_object('property_id', NEW.id);
        ELSE
            RETURN NEW; -- Skip if not a publish event
        END IF;

    -- D. Inquiry (Contact Message)
    ELSIF v_type = 'inquiry' THEN
        v_subject := 'New Inquiry from ' || COALESCE(NEW.name, 'Unknown');
        v_metadata := jsonb_build_object('contact_id', NEW.id, 'email', NEW.email);

    -- E. Support Ticket
    ELSIF v_type = 'support' THEN
        v_subject := 'Support Ticket: ' || COALESCE(NEW.subject, 'No Subject');
        v_metadata := jsonb_build_object('ticket_id', NEW.id, 'priority', NEW.priority);

    -- F. Subscription
    ELSIF v_type = 'subscription' THEN
        v_subject := 'New Subscription: ' || COALESCE(NEW.plan_id, 'Unknown Plan');
        v_metadata := jsonb_build_object('subscription_id', NEW.id);

    -- G. Verification Request
    ELSIF v_type = 'verification' THEN
        v_subject := 'Verification Request Submitted';
        v_metadata := jsonb_build_object('verification_id', NEW.id, 'company_id', NEW.company_id);

    -- H. Withdrawal Request
    ELSIF v_type = 'withdrawal' THEN
        v_subject := 'Withdrawal Request: ₦' || COALESCE(NEW.amount::text, '0');
        v_metadata := jsonb_build_object('withdrawal_id', NEW.id, 'amount', NEW.amount);

    -- I. Domain Request
    ELSIF v_type = 'domain' THEN
        v_subject := 'Domain Request: ' || COALESCE(NEW.business_name, 'New Domain');
        v_metadata := jsonb_build_object('domain_id', NEW.id);

    -- J. Referral
    ELSIF v_type = 'referral' THEN
        v_subject := 'New Referral Signup';
        v_metadata := jsonb_build_object('referral_id', NEW.id);

    -- K. Property Boost
    ELSIF v_type = 'boost' THEN
        v_subject := 'Property Boost Payment: ₦' || COALESCE(NEW.amount_paid::text, '0');
        v_metadata := jsonb_build_object('boost_id', NEW.id, 'amount', NEW.amount_paid);

    END IF;

    -- INSERT LOG
    INSERT INTO public.admin_notifications_log (type, subject, recipient, metadata, status)
    VALUES (v_type, v_subject, 'admin', v_metadata, 'pending');

    RETURN NEW;
END;
$$;


-- 4. ATTACH TRIGGERS TO TABLES

-- 1. Companies
CREATE TRIGGER on_new_company
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('new_user');

-- 2. Properties (Create and Publish)
CREATE TRIGGER on_new_property
AFTER INSERT ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('new_property');

CREATE TRIGGER on_property_publish
AFTER UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('property_published');

-- 3. Contact Messages
CREATE TRIGGER on_new_inquiry
AFTER INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('inquiry');

-- 4. Support Tickets
CREATE TRIGGER on_new_ticket
AFTER INSERT ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('support');

-- 5. Subscriptions
CREATE TRIGGER on_new_sub
AFTER INSERT ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('subscription');

-- 6. Verification Requests
CREATE TRIGGER on_new_verification
AFTER INSERT ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('verification');

-- 7. Withdrawal Requests
CREATE TRIGGER on_new_withdrawal
AFTER INSERT ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('withdrawal');

-- 8. Domain Requests
CREATE TRIGGER on_new_domain
AFTER INSERT ON public.domain_requests
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('domain');

-- 9. Referrals
CREATE TRIGGER on_new_referral
AFTER INSERT ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('referral');

-- 10. Property Boosts
CREATE TRIGGER on_new_boost
AFTER INSERT ON public.property_boosts
FOR EACH ROW EXECUTE FUNCTION public.trigger_admin_notification('boost');
