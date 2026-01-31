-- Create platform_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Insert default values if they conflict do nothing (preserve existing)
INSERT INTO public.platform_settings (key, value)
VALUES 
    ('maintenance_mode', 'false'::jsonb),
    ('platform_name', '"REBAL"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Policy 1: Allow everyone (anon and authenticated) to READ settings
-- This is CRITICAL for the MaintenanceGuard to work for public visitors
DROP POLICY IF EXISTS "Allow public read access" ON public.platform_settings;
CREATE POLICY "Allow public read access" 
ON public.platform_settings FOR SELECT 
TO anon, authenticated
USING (true);

-- Policy 2: Allow ONLY admins to UPDATE/INSERT settings
-- Assumes you have a check_admin function or similar, or we can use the user_roles table approach
DROP POLICY IF EXISTS "Allow admin modify access" ON public.platform_settings;
CREATE POLICY "Allow admin modify access" 
ON public.platform_settings FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Grant permissions explicitly
GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT ALL ON public.platform_settings TO service_role;
