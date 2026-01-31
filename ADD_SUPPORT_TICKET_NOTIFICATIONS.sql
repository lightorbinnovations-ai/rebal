-- Add support_tickets to the notification trigger

-- Update the trigger function to handle support_tickets
CREATE OR REPLACE FUNCTION public.handle_admin_notification_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as superuser/admin to bypass RLS on log table
AS $$
BEGIN
  BEGIN
    IF TG_OP = 'INSERT' THEN
      IF TG_TABLE_NAME = 'contact_messages' THEN
        INSERT INTO public.admin_notifications_log (type, subject, recipient, status, metadata)
        VALUES (
          'support',
          'New Contact Msg: ' || COALESCE(NEW.name, 'Unknown'),
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
      ELSIF TG_TABLE_NAME = 'support_tickets' THEN
        INSERT INTO public.admin_notifications_log (type, subject, recipient, status, metadata)
        VALUES (
          'support',
          'New Support Ticket: ' || COALESCE(NEW.subject, 'No Subject'),
          'admin',
          'pending',
          jsonb_build_object('ticket_id', NEW.id, 'company_id', NEW.company_id, 'priority', NEW.priority)
        );
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If notification fails, LOG IT but DO NOT FAIL the original transaction
    RAISE WARNING 'Admin notification trigger failed: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Create trigger for support_tickets
DROP TRIGGER IF EXISTS trigger_admin_notification_support_ticket ON public.support_tickets;

CREATE TRIGGER trigger_admin_notification_support_ticket
AFTER INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.handle_admin_notification_trigger();
