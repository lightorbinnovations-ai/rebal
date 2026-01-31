-- Recreate the company_profiles view with ALL needed public fields including contact info
DROP VIEW IF EXISTS company_profiles;

CREATE VIEW company_profiles AS
SELECT 
  id,
  name,
  slug,
  tagline,
  description,
  logo_url,
  hero_image_url,
  primary_color,
  secondary_color,
  font_heading,
  font_body,
  button_style,
  footer_bg_color,
  footer_text_color,
  facebook,
  instagram,
  twitter,
  linkedin,
  telegram,
  whatsapp,
  phone,
  email,
  address,
  is_verified
FROM companies;