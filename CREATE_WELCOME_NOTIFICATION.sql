-- Trigger to send a welcome notification to new users

-- Function to handle new user welcome notification
CREATE OR REPLACE FUNCTION public.handle_new_user_welcome()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a welcome notification for the new user
  INSERT INTO public.notifications (
    user_id,
    company_id, -- Can be null initially if company not created yet, or handle via company trigger
    type,
    title,
    message,
    metadata
  )
  VALUES (
    NEW.id,
    NULL, -- We might not have company_id yet if it's just auth.users insert
    'welcome',
    'Welcome to Rebal!',
    'Thank you for joining Rebal. We are excited to help you manage your real estate business efficiently. Complete your profile to get started.',
    '{"action": "complete_profile"}'::jsonb
  );

  RETURN NEW;
END;
$$;

-- Drop trigger if exists to allow cleaner re-runs
DROP TRIGGER IF EXISTS on_auth_user_created_welcome ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_welcome
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_welcome();
