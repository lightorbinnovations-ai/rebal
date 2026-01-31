-- Create a secure RPC function to get user email server-side
-- This replaces client-side calls to supabase.auth.admin.getUserById

CREATE OR REPLACE FUNCTION public.get_user_email_for_admin(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  -- Only allow super_admins to call this function
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: super_admin role required';
  END IF;
  
  -- Get email from auth.users using the service role context
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = p_user_id;
  
  RETURN v_email;
END;
$$;

-- Grant execute to authenticated users (RLS check happens inside function)
GRANT EXECUTE ON FUNCTION public.get_user_email_for_admin(uuid) TO authenticated;

-- Create a safe public company profiles view that hides sensitive contact info
-- Keep only the fields needed for public display
CREATE OR REPLACE VIEW public.public_company_profiles_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  slug,
  tagline,
  description,
  logo_url,
  hero_image_url,
  profile_picture_url,
  primary_color,
  secondary_color,
  font_heading,
  font_body,
  button_style,
  footer_bg_color,
  footer_text_color,
  is_verified,
  -- Social links are typically meant to be public
  facebook,
  instagram,
  twitter,
  linkedin,
  telegram,
  -- Contact info should require authentication or specific access
  -- email and phone are intentionally excluded for public access
  -- whatsapp and address are also excluded
  og_title,
  og_description,
  og_image_url,
  created_at,
  updated_at
FROM public.public_company_profiles;

-- Grant access to the safe view
GRANT SELECT ON public.public_company_profiles_safe TO anon, authenticated;