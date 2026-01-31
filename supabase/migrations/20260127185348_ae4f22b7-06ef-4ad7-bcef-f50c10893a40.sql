-- Grant super_admin SELECT access to analytics table
CREATE POLICY "Super admins can view all analytics"
ON public.analytics FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Grant super_admin access to platform_settings
CREATE POLICY "Super admins can view platform settings"
ON public.platform_settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert platform settings"
ON public.platform_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update platform settings"
ON public.platform_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Grant super_admin access to admin_notifications_log
CREATE POLICY "Super admins can view admin notifications log"
ON public.admin_notifications_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert admin notifications log"
ON public.admin_notifications_log FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));