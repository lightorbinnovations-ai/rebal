-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: Users can only view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- RLS: Only super_admins can manage roles
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Create platform_settings table for admin configuration
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Public can read certain settings
CREATE POLICY "Public can read platform settings"
ON public.platform_settings
FOR SELECT
USING (key IN ('platform_name', 'logo_url', 'social_links', 'footer_info'));

-- Only super_admins can modify settings
CREATE POLICY "Super admins can manage settings"
ON public.platform_settings
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Create admin_activity_log for tracking admin actions
CREATE TABLE public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Only super_admins can view/insert activity logs
CREATE POLICY "Super admins can view activity logs"
ON public.admin_activity_log
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert activity logs"
ON public.admin_activity_log
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('platform_name', '"REBAL"'),
  ('logo_url', 'null'),
  ('social_links', '{"twitter": "", "facebook": "", "instagram": "", "linkedin": ""}'),
  ('footer_info', '{"email": "rebalpros@gmail.com", "phone": "", "address": ""}'),
  ('maintenance_mode', 'false');