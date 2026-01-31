-- Add INSERT policy for super admins on referrals table
CREATE POLICY "Super admins can insert referrals"
ON public.referrals
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add INSERT policy for super admins on admin_notifications_log
CREATE POLICY "Super admins can insert admin notifications"
ON public.admin_notifications_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add SELECT policy for super admins on admin_notifications_log if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'admin_notifications_log' 
    AND policyname = 'Super admins can view all admin notifications'
  ) THEN
    CREATE POLICY "Super admins can view all admin notifications"
    ON public.admin_notifications_log
    FOR SELECT
    USING (has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END $$;