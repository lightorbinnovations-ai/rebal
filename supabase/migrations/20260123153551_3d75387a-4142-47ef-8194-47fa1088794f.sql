-- Add priority_score column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS priority_score integer DEFAULT 1;

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_properties_priority_score ON public.properties(priority_score DESC, created_at DESC);

-- Create function to calculate and update priority score based on company subscription
CREATE OR REPLACE FUNCTION public.update_property_priority_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_tier text;
  base_score integer;
BEGIN
  -- Get company's subscription status
  SELECT subscription_status INTO company_tier
  FROM public.companies
  WHERE id = NEW.company_id;
  
  -- Calculate base score from subscription tier
  CASE company_tier
    WHEN 'active' THEN
      -- Check subscription plan from subscriptions table
      SELECT CASE sp.id
        WHEN 'premium' THEN 4
        WHEN 'pro' THEN 3
        WHEN 'starter' THEN 2
        ELSE 1
      END INTO base_score
      FROM public.subscriptions s
      JOIN public.subscription_plans sp ON s.plan_id = sp.id
      WHERE s.company_id = NEW.company_id
      LIMIT 1;
    WHEN 'trialing' THEN base_score := 1;
    ELSE base_score := 1;
  END CASE;
  
  NEW.priority_score := COALESCE(base_score, 1);
  RETURN NEW;
END;
$$;

-- Create trigger to auto-update priority score on property insert/update
DROP TRIGGER IF EXISTS trigger_update_property_priority ON public.properties;
CREATE TRIGGER trigger_update_property_priority
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_priority_score();

-- Create function to sync all properties when company subscription changes
CREATE OR REPLACE FUNCTION public.sync_company_properties_priority()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all properties for this company to trigger priority recalculation
  UPDATE public.properties
  SET updated_at = now()
  WHERE company_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger on companies table to sync when subscription changes
DROP TRIGGER IF EXISTS trigger_sync_properties_priority ON public.companies;
CREATE TRIGGER trigger_sync_properties_priority
  AFTER UPDATE OF subscription_status ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_company_properties_priority();

-- Create function for public property search with filters
CREATE OR REPLACE FUNCTION public.search_public_properties(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_property_type text DEFAULT NULL,
  p_purpose text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_search_query text DEFAULT NULL
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
  features text[],
  priority_score integer,
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
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint;
BEGIN
  -- Get total count first
  SELECT COUNT(*) INTO v_total
  FROM public.properties p
  JOIN public.companies c ON p.company_id = c.id
  WHERE p.is_active = true
    AND is_subscription_active(p.company_id)
    AND (p_property_type IS NULL OR p.property_type = p_property_type)
    AND (p_purpose IS NULL OR p.purpose = p_purpose)
    AND (p_state IS NULL OR p.state = p_state)
    AND (p_city IS NULL OR p.city = p_city)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_search_query IS NULL OR 
         p.title ILIKE '%' || p_search_query || '%' OR 
         p.description ILIKE '%' || p_search_query || '%' OR
         p.location ILIKE '%' || p_search_query || '%');

  RETURN QUERY
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
    p.priority_score,
    p.created_at,
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    c.logo_url as company_logo,
    c.is_verified as company_verified,
    c.subscription_status as subscription_tier,
    v_total as total_count
  FROM public.properties p
  JOIN public.companies c ON p.company_id = c.id
  WHERE p.is_active = true
    AND is_subscription_active(p.company_id)
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
  ORDER BY p.priority_score DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;