CREATE OR REPLACE FUNCTION get_public_company_profile_safe(company_slug text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'id', c.id,
    'slug', c.slug,
    'name', c.name,
    'tagline', c.tagline,
    'description', c.description,
    'logo_url', c.logo_url,
    'hero_image_url', c.hero_image_url,
    'profile_picture_url', c.profile_picture_url,
    'phone', c.phone,
    'email', c.email,
    'address', c.address,
    'whatsapp', c.whatsapp,
    'telegram', c.telegram,
    'facebook', c.facebook,
    'instagram', c.instagram,
    'twitter', c.twitter,
    'linkedin', c.linkedin,
    'is_verified', c.is_verified,
    'primary_color', cb.primary_color,
    'secondary_color', cb.secondary_color,
    'font_heading', cb.font_heading,
    'font_body', cb.font_body,
    'button_style', cb.button_style,
    'footer_bg_color', cb.footer_bg_color,
    'footer_text_color', cb.footer_text_color,
    'og_title', c.og_title,
    'og_description', c.og_description,
    'og_image_url', c.og_image_url,
    'personal_bio', c.personal_bio,
    'custom_domain', cd.domain
  )
  FROM companies c
  LEFT JOIN company_branding cb ON c.id = cb.company_id
  LEFT JOIN custom_domains cd ON c.id = cd.company_id AND cd.status = 'active'
  WHERE c.slug = company_slug;
END;
$$;
