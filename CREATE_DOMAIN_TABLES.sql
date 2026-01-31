-- Create domain_pricing table
CREATE TABLE IF NOT EXISTS public.domain_pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    extension TEXT NOT NULL UNIQUE,
    yearly_price NUMERIC NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on domain_pricing
ALTER TABLE public.domain_pricing ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone for pricing
CREATE POLICY "Allow public read access" ON public.domain_pricing FOR SELECT USING (true);

-- Allow full access to admins/service role
CREATE POLICY "Allow admin full access" ON public.domain_pricing FOR ALL USING (auth.role() = 'service_role');


-- Create domain_requests table
CREATE TABLE IF NOT EXISTS public.domain_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    selected_domain TEXT,
    selected_extension TEXT,
    domain_price NUMERIC DEFAULT 0,
    email_price NUMERIC DEFAULT 0,
    total_price NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, price_sent, paid, processing, active, rejected, cancelled
    admin_note TEXT,
    email_prefix TEXT,
    forward_to_email TEXT,
    email_status TEXT DEFAULT 'none',
    paid_at TIMESTAMP WITH TIME ZONE,
    price_set_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on domain_requests
ALTER TABLE public.domain_requests ENABLE ROW LEVEL SECURITY;

-- Policies for domain_requests
CREATE POLICY "Users can view their own company requests" ON public.domain_requests
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.companies WHERE id = company_id));

CREATE POLICY "Users can insert requests for their company" ON public.domain_requests
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.companies WHERE id = company_id));

CREATE POLICY "Users can update their own pending requests" ON public.domain_requests
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM public.companies WHERE id = company_id) AND 
        status = 'pending'
    );

CREATE POLICY "Admins/Service have full access to requests" ON public.domain_requests
    FOR ALL USING (auth.role() = 'service_role');


-- Create custom_domains table (if not exists - usually this might exist from previous attempts)
CREATE TABLE IF NOT EXISTS public.custom_domains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    domain TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending', -- pending, verifying, active, failed
    verification_token TEXT DEFAULT replace(cast(gen_random_uuid() as text), '-', ''),
    verified_at TIMESTAMP WITH TIME ZONE,
    help_requested BOOLEAN DEFAULT false,
    help_notes TEXT,
    help_requested_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on custom_domains
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- Policies for custom_domains
CREATE POLICY "Users can view their own domains" ON public.custom_domains
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.companies WHERE id = company_id));

CREATE POLICY "Users can insert domains for their company" ON public.custom_domains
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.companies WHERE id = company_id));

CREATE POLICY "Users can update their own domains" ON public.custom_domains
    FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.companies WHERE id = company_id));

CREATE POLICY "Admins/Service have full access to domains" ON public.custom_domains
    FOR ALL USING (auth.role() = 'service_role');


-- Seed initial pricing data
INSERT INTO public.domain_pricing (extension, yearly_price, is_available)
VALUES 
    ('.com', 18000, true),
    ('.com.ng', 5000, true),
    ('.ng', 25000, true),
    ('.co', 35000, true),
    ('.org', 15000, true),
    ('.site', 3500, true)
ON CONFLICT (extension) DO UPDATE
SET yearly_price = EXCLUDED.yearly_price, is_available = EXCLUDED.is_available;
