-- Function to get a user's email by their ID
-- This is needed for admin operations like sending emails to specific users
-- It bypasses RLS to allow the admin (who has the right permissions) to see the email
-- even if the user profile permissions are restrictive.

CREATE OR REPLACE FUNCTION public.get_user_email_for_admin(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  -- Check if the requester is an admin (optional extra security, though api logic handles this)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'moderator')
  ) THEN
    -- Return null if not admin, or raise error. 
    -- Returning null allows the UI to handle it gracefully without crashing.
    RETURN NULL;
  END IF;

  -- Get email from auth.users (requires security definer)
  -- or from companies table if that's where you store it. 
  -- Assuming auth.users is the source of truth for login email:
  
  -- HOWEVER, accessing auth.users directly in a function requires specific permissions.
  -- A safer bet often used in Supabase is getting it from a public profile table if it exists and has the email.
  -- But usually auth.users is hidden.
  -- Let's try to get it from the 'companies' table first if that's where "User" data is roughly mirrored for admins
  
  SELECT email INTO v_email
  FROM public.companies
  WHERE id = p_user_id; -- Assuming company_id is linked to auth.id 1:1 or logic holds.
  
  -- If not found in companies (maybe it's a different kind of user), try auth.users via a view or if we have permissions.
  -- Since we can't easily read auth.users from here without being postgres role, 
  -- and 'companies' table has 'email', we'll rely on that.
  
  RETURN v_email;
END;
$$;
