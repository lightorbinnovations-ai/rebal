-- Add branding color columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#0F172A',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#3B82F6';

-- Update demo company with default colors
UPDATE public.companies 
SET primary_color = '#0F172A', secondary_color = '#3B82F6'
WHERE slug = 'prime-realty-ng';