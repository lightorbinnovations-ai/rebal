-- Add lead scoring fields to inquiries table
ALTER TABLE public.inquiries
ADD COLUMN IF NOT EXISTS lead_score text DEFAULT 'cold',
ADD COLUMN IF NOT EXISTS page_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_spent_seconds integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS properties_viewed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone DEFAULT now();

-- Add structured location fields to properties for location-first search
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS area text,
ADD COLUMN IF NOT EXISTS landmark text;

-- Create index for location-based searches
CREATE INDEX IF NOT EXISTS idx_properties_state ON public.properties(state);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_area ON public.properties(area);

-- Create lead_tracking table for anonymous visitor tracking before inquiry
CREATE TABLE IF NOT EXISTS public.lead_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  company_id uuid NOT NULL,
  property_id uuid,
  page_views integer DEFAULT 1,
  time_spent_seconds integer DEFAULT 0,
  properties_viewed text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on lead_tracking
ALTER TABLE public.lead_tracking ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert tracking data
CREATE POLICY "Anyone can insert lead tracking"
ON public.lead_tracking
FOR INSERT
WITH CHECK (true);

-- Allow company owners to view their lead tracking
CREATE POLICY "Owners can view their lead tracking"
ON public.lead_tracking
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM companies
  WHERE companies.id = lead_tracking.company_id
  AND companies.user_id = auth.uid()
));

-- Create Nigerian locations reference table
CREATE TABLE IF NOT EXISTS public.nigerian_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state text NOT NULL,
  city text,
  area text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS - publicly readable
ALTER TABLE public.nigerian_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view locations"
ON public.nigerian_locations
FOR SELECT
USING (true);

-- Insert major Nigerian states and cities
INSERT INTO public.nigerian_locations (state, city, area) VALUES
-- Lagos
('Lagos', 'Lagos Island', 'Victoria Island'),
('Lagos', 'Lagos Island', 'Ikoyi'),
('Lagos', 'Lagos Island', 'Lekki Phase 1'),
('Lagos', 'Lagos Island', 'Lekki Phase 2'),
('Lagos', 'Lagos Island', 'Ajah'),
('Lagos', 'Lagos Mainland', 'Yaba'),
('Lagos', 'Lagos Mainland', 'Surulere'),
('Lagos', 'Lagos Mainland', 'Ikeja'),
('Lagos', 'Lagos Mainland', 'Maryland'),
('Lagos', 'Lagos Mainland', 'Gbagada'),
('Lagos', 'Lagos Mainland', 'Magodo'),
('Lagos', 'Lagos Mainland', 'Ojodu'),
-- Abuja
('FCT', 'Abuja', 'Maitama'),
('FCT', 'Abuja', 'Asokoro'),
('FCT', 'Abuja', 'Wuse'),
('FCT', 'Abuja', 'Wuse 2'),
('FCT', 'Abuja', 'Garki'),
('FCT', 'Abuja', 'Gwarinpa'),
('FCT', 'Abuja', 'Jabi'),
('FCT', 'Abuja', 'Lugbe'),
('FCT', 'Abuja', 'Kubwa'),
('FCT', 'Abuja', 'Lokogoma'),
-- Rivers
('Rivers', 'Port Harcourt', 'GRA Phase 1'),
('Rivers', 'Port Harcourt', 'GRA Phase 2'),
('Rivers', 'Port Harcourt', 'Trans Amadi'),
('Rivers', 'Port Harcourt', 'Rumuokwuta'),
-- Oyo
('Oyo', 'Ibadan', 'Bodija'),
('Oyo', 'Ibadan', 'Ring Road'),
('Oyo', 'Ibadan', 'Oluyole'),
('Oyo', 'Ibadan', 'Dugbe'),
-- Enugu
('Enugu', 'Enugu', 'Independence Layout'),
('Enugu', 'Enugu', 'GRA'),
('Enugu', 'Enugu', 'Trans Ekulu'),
-- Kaduna
('Kaduna', 'Kaduna', 'Barnawa'),
('Kaduna', 'Kaduna', 'Malali'),
('Kaduna', 'Kaduna', 'Ungwan Rimi'),
-- Kano
('Kano', 'Kano', 'Nassarawa'),
('Kano', 'Kano', 'Sabon Gari'),
-- Delta
('Delta', 'Warri', 'GRA'),
('Delta', 'Asaba', 'GRA'),
-- Edo
('Edo', 'Benin City', 'GRA'),
('Edo', 'Benin City', 'Ring Road'),
-- Anambra
('Anambra', 'Onitsha', 'GRA'),
('Anambra', 'Awka', 'Amawbia'),
-- Cross River
('Cross River', 'Calabar', 'State Housing'),
-- Akwa Ibom
('Akwa Ibom', 'Uyo', 'Ewet Housing'),
-- Ondo
('Ondo', 'Akure', 'Alagbaka'),
-- Osun
('Osun', 'Osogbo', 'GRA'),
-- Kwara
('Kwara', 'Ilorin', 'GRA'),
-- Plateau
('Plateau', 'Jos', 'Rayfield');

-- Create trigger to update lead_tracking updated_at
CREATE TRIGGER update_lead_tracking_updated_at
BEFORE UPDATE ON public.lead_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();