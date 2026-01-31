ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
