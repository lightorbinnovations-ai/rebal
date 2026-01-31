-- Function to handle admin notifications automatically
CREATE OR REPLACE FUNCTION public.handle_admin_notification_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle updates (e.g., status changes) if needed, but primarily Insert
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'contact_messages' THEN
      INSERT INTO public.admin_notifications_log (type, subject, recipient, status, metadata)
      VALUES (
        'support',
        'New Contact Msg: ' || NEW.name,
        'admin',
        'pending',
        jsonb_build_object('message_id', NEW.id, 'email', NEW.email, 'source', 'general_contact')
      );
    ELSIF TG_TABLE_NAME = 'verification_requests' THEN
      INSERT INTO public.admin_notifications_log (type, subject, recipient, status, metadata)
      VALUES (
        'verification',
        'New Verification Request',
        'admin',
        'pending',
        jsonb_build_object('verification_id', NEW.id, 'company_id', NEW.company_id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist to avoid duplication
DROP TRIGGER IF EXISTS trigger_admin_notification_contact ON public.contact_messages;
DROP TRIGGER IF EXISTS trigger_admin_notification_verification ON public.verification_requests;

-- Create Trigger for contact_messages
CREATE TRIGGER trigger_admin_notification_contact
AFTER INSERT ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_admin_notification_trigger();

-- Create Trigger for verification_requests
CREATE TRIGGER trigger_admin_notification_verification
AFTER INSERT ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_admin_notification_trigger();
