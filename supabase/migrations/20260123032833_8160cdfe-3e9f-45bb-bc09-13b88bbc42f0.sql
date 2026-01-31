-- Add email confirmation tracking to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS last_email_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Set initial value for existing companies (assume they confirmed at creation)
UPDATE public.companies 
SET last_email_confirmed_at = created_at 
WHERE last_email_confirmed_at IS NULL;

-- Create a table to track email re-verification tokens
CREATE TABLE IF NOT EXISTS public.email_reverification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_reverification_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only read their own tokens (for verification)
CREATE POLICY "Users can read own tokens"
ON public.email_reverification_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create index for token lookup
CREATE INDEX idx_reverification_token ON public.email_reverification_tokens(token);
CREATE INDEX idx_reverification_user_expires ON public.email_reverification_tokens(user_id, expires_at);

-- Function to check if email reverification is required (30 days)
CREATE OR REPLACE FUNCTION public.needs_email_reverification(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT last_email_confirmed_at < (now() - INTERVAL '30 days')
     FROM public.companies 
     WHERE user_id = p_user_id),
    true
  )
$$;

-- Function to update email confirmation timestamp
CREATE OR REPLACE FUNCTION public.confirm_email_reverification(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.companies
  SET last_email_confirmed_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;