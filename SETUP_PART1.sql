CREATE TABLE IF NOT EXISTS public.realtor_stats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    years_experience integer DEFAULT 0,
    satisfaction_rate integer DEFAULT 100,
    active_listings integer DEFAULT 0,
    total_applicants integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(company_id)
);

ALTER TABLE public.realtor_stats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'realtor_stats' AND policyname = 'Public can view realtor stats'
    ) THEN
        CREATE POLICY "Public can view realtor stats" ON public.realtor_stats FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'realtor_stats' AND policyname = 'Owners can manage their own stats'
    ) THEN
        CREATE POLICY "Owners can manage their own stats" ON public.realtor_stats FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;
