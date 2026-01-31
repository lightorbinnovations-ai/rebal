CREATE OR REPLACE FUNCTION search_public_properties(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_property_type TEXT DEFAULT NULL,
  p_purpose TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  description text,
  price numeric,
  property_type text,
  purpose text,
  state text,
  city text,
  area text,
  main_image_url text,
  features text[], -- Changed to text[] to match likely schema
  priority_score int,
  created_at timestamptz,
  company_id uuid,
  company_name text,
  company_slug text,
  company_logo text,
  company_verified boolean,
  subscription_tier text,
  total_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_properties AS (
    SELECT 
      p.id,
      p.title,
      p.slug,
      p.description,
      p.price,
      p.property_type,
      p.purpose,
      p.state,
      p.city,
      p.area,
      p.main_image_url,
      p.features,
      COALESCE(p.priority_score, 0) as priority_score,
      p.created_at,
      p.company_id
    FROM properties p
    WHERE p.is_active = true
      AND (p_property_type IS NULL OR p.property_type = p_property_type)
      AND (p_purpose IS NULL OR p.purpose = p_purpose)
      AND (p_state IS NULL OR p.state = p_state)
      AND (p_city IS NULL OR p.city = p_city)
      AND (p_min_price IS NULL OR p.price >= p_min_price)
      AND (p_max_price IS NULL OR p.price <= p_max_price)
      AND (p_search_query IS NULL OR 
           p.title ILIKE '%' || p_search_query || '%' OR 
           p.description ILIKE '%' || p_search_query || '%' OR
           p.location ILIKE '%' || p_search_query || '%')
  ),
  total AS (
    SELECT COUNT(*) as count FROM filtered_properties
  )
  SELECT 
    fp.id,
    fp.title,
    fp.slug,
    fp.description,
    fp.price,
    fp.property_type,
    fp.purpose,
    fp.state,
    fp.city,
    fp.area,
    fp.main_image_url,
    fp.features::text[], -- Cast to text array if needed
    fp.priority_score,
    fp.created_at,
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    c.logo_url as company_logo,
    c.is_verified as company_verified,
    sp.name as subscription_tier,
    t.count as total_count
  FROM filtered_properties fp
  JOIN companies c ON fp.company_id = c.id
  LEFT JOIN subscriptions s ON s.company_id = c.id AND s.status = 'active'
  LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
  CROSS JOIN total t
  ORDER BY 
    fp.priority_score DESC, -- Boosted properties first (100 vs 10)
    COALESCE(sp.monthly_price, 0) DESC, -- Higher tier plans next
    fp.created_at DESC -- Newest first
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
