-- 1. Create the version increment function
CREATE OR REPLACE FUNCTION increment_og_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version
  NEW.og_version = COALESCE(OLD.og_version, 0) + 1;
  
  -- Update updated_at if it exists (it usually does)
  IF (TG_OP = 'UPDATE') THEN
      -- Check if updated_at column exists before updating
      -- (Assuming standard updated_at exists, but being safe)
      BEGIN
          NEW.updated_at = NOW();
      EXCEPTION WHEN OTHERS THEN
          -- Ignore if updated_at doesn't exist
      END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Add og_version column to PROPERTIES
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS og_version INTEGER DEFAULT 1;

-- 3. Trigger for PROPERTIES
DROP TRIGGER IF EXISTS tr_increment_property_og_version ON properties;

CREATE TRIGGER tr_increment_property_og_version
BEFORE UPDATE ON properties
FOR EACH ROW
WHEN (
  OLD.title IS DISTINCT FROM NEW.title OR
  OLD.price IS DISTINCT FROM NEW.price OR
  OLD.main_image_url IS DISTINCT FROM NEW.main_image_url OR
  OLD.purpose IS DISTINCT FROM NEW.purpose OR
  OLD.description IS DISTINCT FROM NEW.description OR
  OLD.location IS DISTINCT FROM NEW.location OR
  OLD.city IS DISTINCT FROM NEW.city OR
  OLD.state IS DISTINCT FROM NEW.state OR
  OLD.company_id IS DISTINCT FROM NEW.company_id
)
EXECUTE FUNCTION increment_og_version();

-- 4. Add og_version column to COMPANIES
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS og_version INTEGER DEFAULT 1;

-- 5. Trigger for COMPANIES
DROP TRIGGER IF EXISTS tr_increment_company_og_version ON companies;

CREATE TRIGGER tr_increment_company_og_version
BEFORE UPDATE ON companies
FOR EACH ROW
WHEN (
  OLD.name IS DISTINCT FROM NEW.name OR
  OLD.logo_url IS DISTINCT FROM NEW.logo_url OR
  OLD.hero_image_url IS DISTINCT FROM NEW.hero_image_url OR
  OLD.tagline IS DISTINCT FROM NEW.tagline OR
  OLD.description IS DISTINCT FROM NEW.description
)
EXECUTE FUNCTION increment_og_version();
