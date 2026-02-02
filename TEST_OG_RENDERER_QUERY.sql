-- Test if the og-renderer can fetch the property data with the anon key
-- This simulates what the Edge Function does

SELECT 
    title, 
    main_image_url, 
    price, 
    location, 
    city, 
    state, 
    companies.name as company_name,
    companies.logo_url
FROM properties
LEFT JOIN companies ON properties.company_id = companies.id
WHERE properties.id = '692fca22-b1c4-4c45-8ba4-de90880e2c38';

-- If this returns data: The query works
-- If this returns nothing: RLS is blocking the join or the property doesn't exist
-- If this errors: Permission issue or column doesn't exist
