-- ================================================
-- CREATE PROPERTY BOOSTS TABLE
-- Run this in your Supabase SQL Editor
-- ================================================

-- Create the property_boosts table
CREATE TABLE IF NOT EXISTS public.property_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('paid', 'tier_included', 'promotional')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  boost_score INTEGER NOT NULL DEFAULT 10,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  amount_paid INTEGER DEFAULT 0,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_boosts_property_id ON public.property_boosts(property_id);
CREATE INDEX IF NOT EXISTS idx_property_boosts_company_id ON public.property_boosts(company_id);
CREATE INDEX IF NOT EXISTS idx_property_boosts_status ON public.property_boosts(status);
CREATE INDEX IF NOT EXISTS idx_property_boosts_expires_at ON public.property_boosts(expires_at);

-- Enable RLS
ALTER TABLE public.property_boosts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own company's boosts
CREATE POLICY "Users can view own company boosts"
  ON public.property_boosts
  FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- Users can insert boosts for their own company
CREATE POLICY "Users can insert own company boosts"
  ON public.property_boosts
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- Users can update their own company's boosts
CREATE POLICY "Users can update own company boosts"
  ON public.property_boosts
  FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- Service role bypass for Edge Functions
CREATE POLICY "Service role full access"
  ON public.property_boosts
  FOR ALL
  USING (auth.role() = 'service_role');

-- Note: Admin access is handled via service_role or direct database access

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_property_boosts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_property_boosts_updated_at ON public.property_boosts;
CREATE TRIGGER set_property_boosts_updated_at
  BEFORE UPDATE ON public.property_boosts
  FOR EACH ROW
  EXECUTE FUNCTION update_property_boosts_updated_at();

-- Grant permissions
GRANT ALL ON public.property_boosts TO authenticated;
GRANT SELECT ON public.property_boosts TO anon;

-- Success message
SELECT 'property_boosts table created successfully!' as result;
