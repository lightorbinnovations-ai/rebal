-- Add remaining super_admin policies (avoiding duplicates)

-- Verification requests UPDATE policy for admin
CREATE POLICY "Super admins can update all verification requests"
ON public.verification_requests
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Notifications policy for admin to insert notifications for users
CREATE POLICY "Super admins can insert notifications for any user"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Property boosts UPDATE policy for admin  
CREATE POLICY "Super admins can update all boosts"
ON public.property_boosts
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));