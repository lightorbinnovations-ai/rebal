-- FIX SECURITY ISSUES REPORTED BY SECURITY ADVISOR

-- 1. Enable RLS on user_roles (High Severity)
-- Prevents unauthorized access to role definitions
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Fix "Security Definer View" (High Severity)
-- Forces views to respect RLS policies of the user querying them, 
-- instead of running with the permissions of the view creator (Super Admin).
ALTER VIEW public.public_company_profiles_safe SET (security_invoker = true);
ALTER VIEW public.custom_domains_safe SET (security_invoker = true);

-- 3. Fix "Function Search Path Mutable" (Medium Severity)
-- Prevents potential search path hijacking attacks on the security-critical is_admin function.
ALTER FUNCTION public.is_admin() SET search_path = public;

-- 4. Fix other Critical Functions (Good Practice)
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.is_subscription_active(uuid) SET search_path = public;
ALTER FUNCTION public.expire_grace_periods() SET search_path = public;
