-- Create short_links table for URL shortener
CREATE TABLE public.short_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_code text NOT NULL UNIQUE,
  full_path text NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  click_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_short_links_short_code ON public.short_links(short_code);
CREATE INDEX idx_short_links_company_id ON public.short_links(company_id);
CREATE INDEX idx_short_links_property_id ON public.short_links(property_id);

-- Enable RLS
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Public can read short links (for redirects)
CREATE POLICY "Anyone can read short links for redirects"
ON public.short_links
FOR SELECT
USING (true);

-- Company owners can manage their short links
CREATE POLICY "Company owners can manage their short links"
ON public.short_links
FOR ALL
USING (EXISTS (
  SELECT 1 FROM companies
  WHERE companies.id = short_links.company_id
    AND companies.user_id = auth.uid()
));

-- Function to increment click count (security definer to bypass RLS for updates)
CREATE OR REPLACE FUNCTION public.increment_short_link_click(p_short_code text)
RETURNS TABLE (full_path text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE short_links
  SET click_count = click_count + 1,
      updated_at = now()
  WHERE short_code = p_short_code;

  RETURN QUERY
  SELECT sl.full_path
  FROM short_links sl
  WHERE sl.short_code = p_short_code;
END;
$$;

-- Function to generate unique short code
CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result text := '';
  i integer;
  code_exists boolean := true;
BEGIN
  WHILE code_exists LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM short_links WHERE short_code = result) INTO code_exists;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Add updated_at trigger
CREATE TRIGGER update_short_links_updated_at
  BEFORE UPDATE ON public.short_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();