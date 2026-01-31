-- ==========================================
-- 1. FIX CONTACT_MESSAGES PERMISSIONS
-- ==========================================

-- Enable RLS just in case
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous inserts to contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow viewing contact_messages for authenticated users" ON public.contact_messages;

-- Create robust insert policy for EVERYONE (anon + authenticated)
CREATE POLICY "Allow anonymous inserts to contact_messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users (admins) to view
CREATE POLICY "Allow viewing contact_messages for authenticated users"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (true);

-- Explicitly grant permissions to roles
GRANT ALL ON public.contact_messages TO service_role;
GRANT SELECT, INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT ON public.contact_messages TO authenticated;


-- ==========================================
-- 2. ROBUST NOTIFICATION TRIGGER
-- ==========================================

-- Redefine function with exception handling to prevent form failure
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
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If notification fails (e.g. table doesn't exist, schema mismatch), 
    -- LOG IT but DO NOT FAIL the original transaction.
    -- This ensures the user's message is still saved.
    RAISE WARNING 'Admin notification trigger failed: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Re-create Triggers
DROP TRIGGER IF EXISTS trigger_admin_notification_contact ON public.contact_messages;
DROP TRIGGER IF EXISTS trigger_admin_notification_verification ON public.verification_requests;

CREATE TRIGGER trigger_admin_notification_contact
AFTER INSERT ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_admin_notification_trigger();

CREATE TRIGGER trigger_admin_notification_verification
AFTER INSERT ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_admin_notification_trigger();


-- ==========================================
-- 3. ENSURE ADMIN LOG PERMISSIONS (Just in case)
-- ==========================================
GRANT INSERT ON public.admin_notifications_log TO postgres, service_role;
-- We don't need to grant to anon because the trigger is SECURITY DEFINER
