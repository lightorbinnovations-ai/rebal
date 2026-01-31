-- Add additional branding columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS font_heading TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS font_body TEXT DEFAULT 'Open Sans',
ADD COLUMN IF NOT EXISTS button_style TEXT DEFAULT 'rounded',
ADD COLUMN IF NOT EXISTS footer_bg_color TEXT DEFAULT '#0F172A',
ADD COLUMN IF NOT EXISTS footer_text_color TEXT DEFAULT '#FFFFFF';

-- Update demo company with defaults
UPDATE public.companies 
SET 
  font_heading = 'Inter',
  font_body = 'Open Sans',
  button_style = 'rounded',
  footer_bg_color = '#0F172A',
  footer_text_color = '#FFFFFF'
WHERE slug = 'prime-realty-ng';