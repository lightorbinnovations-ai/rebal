-- CORRECTED NOTIFICATION TRIGGER FUNCTION
-- Matches the ACTUAL schema of admin_notifications_log

CREATE OR REPLACE FUNCTION public.trigger_admin_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_type text := TG_ARGV[0];
    v_subject text := '';
    v_recipient text := 'admin';
    v_status text := 'pending';
    v_metadata jsonb := '{}';
BEGIN
    -- Build subject and metadata based on event type
    
    -- A. New User / Company
    IF v_type = 'new_user' THEN
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
        v_status := 'pending';

    -- E. Support Ticket
    ELSIF v_type = 'support' THEN
        v_subject := 'Support Ticket: ' || COALESCE(NEW.subject, 'No Subject');
        v_metadata := jsonb_build_object('ticket_id', NEW.id, 'priority', NEW.priority);
        IF NEW.priority = 'high' OR NEW.priority = 'urgent' THEN 
            v_status := 'pending'; 
        END IF;

    -- F. Subscription
    ELSIF v_type = 'subscription' THEN
        v_subject := 'New Subscription: ' || COALESCE(NEW.plan_id, 'Unknown Plan');
        v_metadata := jsonb_build_object('subscription_id', NEW.id);

    -- G. Verification Request
    ELSIF v_type = 'verification' THEN
        v_subject := 'Verification Request Submitted';
        v_metadata := jsonb_build_object('verification_id', NEW.id, 'company_id', NEW.company_id);
        v_status := 'pending';

    -- H. Withdrawal Request
    ELSIF v_type = 'withdrawal' THEN
        v_subject := 'Withdrawal Request: ₦' || COALESCE(NEW.amount::text, '0');
        v_metadata := jsonb_build_object('withdrawal_id', NEW.id, 'amount', NEW.amount);
        v_status := 'pending';

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

    -- INSERT NOTIFICATION (using correct column names)
    INSERT INTO public.admin_notifications_log (type, subject, recipient, metadata, status)
    VALUES (v_type, v_subject, v_recipient, v_metadata, v_status);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Triggers are already attached, no need to recreate them
-- Just run this to update the function
