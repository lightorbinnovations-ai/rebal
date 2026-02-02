-- Fix short_links full_path to match React routes
-- React routes: /:companySlug and /:companySlug/property/:propertySlug

-- First, let's see what we have
SELECT 
    short_code,
    full_path,
    CASE 
        WHEN property_id IS NOT NULL THEN 'Property Link'
        WHEN company_id IS NOT NULL THEN 'Company Link'
        ELSE 'Unknown'
    END as link_type,
    property_id,
    company_id
FROM short_links
ORDER BY created_at DESC;

-- Update company-only links (no property)
UPDATE short_links 
SET full_path = '/' || (
    SELECT slug 
    FROM companies 
    WHERE id = short_links.company_id
)
WHERE company_id IS NOT NULL 
  AND property_id IS NULL;

-- Update property links
UPDATE short_links 
SET full_path = '/' || (
    SELECT c.slug 
    FROM companies c
    WHERE c.id = short_links.company_id
) || '/property/' || (
    SELECT p.slug 
    FROM properties p
    WHERE p.id = short_links.property_id
)
WHERE property_id IS NOT NULL;

-- Verify the updates
SELECT 
    short_code,
    full_path,
    CASE 
        WHEN property_id IS NOT NULL THEN 'Property: ' || (SELECT title FROM properties WHERE id = property_id)
        WHEN company_id IS NOT NULL THEN 'Company: ' || (SELECT name FROM companies WHERE id = company_id)
        ELSE 'Unknown'
    END as description
FROM short_links
ORDER BY created_at DESC;
