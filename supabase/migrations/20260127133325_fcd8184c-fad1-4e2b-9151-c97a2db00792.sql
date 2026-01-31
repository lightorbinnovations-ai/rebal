-- Update search_public_properties to also search by state, city, area, address, and landmark
CREATE OR REPLACE FUNCTION public.search_public_properties(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_property_type TEXT DEFAULT NULL,
  p_purpose TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID, title TEXT, slug TEXT, description TEXT, price NUMERIC,
  property_type TEXT, purpose TEXT, state TEXT, city TEXT, area TEXT,
  main_image_url TEXT, features TEXT[], priority_score INTEGER,
  created_at TIMESTAMPTZ, company_id UUID, company_name TEXT,
  company_slug TEXT, company_logo TEXT, company_verified BOOLEAN,
  subscription_tier TEXT, total_count BIGINT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint;
  v_search_pattern TEXT;
BEGIN
  -- Prepare search pattern
  v_search_pattern := '%' || COALESCE(p_search_query, '') || '%';
  
  SELECT COUNT(*) INTO v_total
  FROM public.properties p
  JOIN public.companies c ON p.company_id = c.id
  WHERE p.is_active = true
    AND is_subscription_active(p.company_id)
    AND (p_property_type IS NULL OR p.property_type ILIKE '%' || p_property_type || '%')
    AND (p_purpose IS NULL OR p.purpose ILIKE '%' || p_purpose || '%')
    AND (p_state IS NULL OR p.state ILIKE '%' || p_state || '%')
    AND (p_city IS NULL OR p.city ILIKE '%' || p_city || '%')
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_search_query IS NULL OR p_search_query = '' OR 
         p.title ILIKE v_search_pattern OR 
         p.description ILIKE v_search_pattern OR
         p.location ILIKE v_search_pattern OR
         p.state ILIKE v_search_pattern OR
         p.city ILIKE v_search_pattern OR
         p.area ILIKE v_search_pattern OR
         p.address ILIKE v_search_pattern OR
         p.landmark ILIKE v_search_pattern);

  RETURN QUERY
  SELECT 
    p.id, p.title, p.slug, p.description, p.price,
    p.property_type, p.purpose, p.state, p.city, p.area,
    p.main_image_url, p.features, p.priority_score, p.created_at,
    c.id as company_id, c.name as company_name, c.slug as company_slug,
    c.logo_url as company_logo, c.is_verified as company_verified,
    c.subscription_status as subscription_tier, v_total as total_count
  FROM public.properties p
  JOIN public.companies c ON p.company_id = c.id
  WHERE p.is_active = true
    AND is_subscription_active(p.company_id)
    AND (p_property_type IS NULL OR p.property_type ILIKE '%' || p_property_type || '%')
    AND (p_purpose IS NULL OR p.purpose ILIKE '%' || p_purpose || '%')
    AND (p_state IS NULL OR p.state ILIKE '%' || p_state || '%')
    AND (p_city IS NULL OR p.city ILIKE '%' || p_city || '%')
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_search_query IS NULL OR p_search_query = '' OR 
         p.title ILIKE v_search_pattern OR 
         p.description ILIKE v_search_pattern OR
         p.location ILIKE v_search_pattern OR
         p.state ILIKE v_search_pattern OR
         p.city ILIKE v_search_pattern OR
         p.area ILIKE v_search_pattern OR
         p.address ILIKE v_search_pattern OR
         p.landmark ILIKE v_search_pattern)
  ORDER BY p.priority_score DESC, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;