-- Test if anon role can read the exact fields the Netlify function needs
-- Run this with the ANON key (not service role) to simulate the function

SELECT 
    title, 
    description, 
    price, 
    main_image_url, 
    gallery_urls, 
    purpose, 
    currency, 
    company_id, 
    og_version
FROM properties 
WHERE id = '692fca22-b1c4-4c45-8ba4-de90880e2c38';

-- If this returns data: RLS is fine, issue is elsewhere
-- If this returns nothing: RLS is blocking, need to fix policy
-- If this errors: Column doesn't exist or permission denied
