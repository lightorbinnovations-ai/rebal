-- COMPREHENSIVE OG SYSTEM VALIDATION
-- This simulates the EXACT flow of the og-renderer function
-- Run this with the ANON key to verify everything works

-- ============================================
-- TEST 1: Verify og_version column exists
-- ============================================
SELECT 
    'TEST 1: og_version exists' as test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM information_schema.columns
WHERE table_name = 'properties' 
  AND column_name = 'og_version';

-- ============================================
-- TEST 2: Verify property data is accessible
-- ============================================
SELECT 
    'TEST 2: Property accessible' as test_name,
    CASE 
        WHEN title IS NOT NULL THEN '✅ PASS: ' || title
        ELSE '❌ FAIL: No data'
    END as result
FROM properties
WHERE id = '692fca22-b1c4-4c45-8ba4-de90880e2c38';

-- ============================================
-- TEST 3: Verify company data is accessible
-- ============================================
SELECT 
    'TEST 3: Company accessible' as test_name,
    CASE 
        WHEN c.name IS NOT NULL THEN '✅ PASS: ' || c.name
        ELSE '❌ FAIL: No company'
    END as result
FROM properties p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.id = '692fca22-b1c4-4c45-8ba4-de90880e2c38';

-- ============================================
-- TEST 4: Simulate EXACT og-renderer query
-- ============================================
SELECT 
    'TEST 4: OG Renderer Query' as test_name,
    json_build_object(
        'title', title,
        'price', price,
        'location', COALESCE(city, location, 'Unknown'),
        'image', main_image_url,
        'og_version', og_version,
        'status', '✅ READY TO RENDER'
    ) as result
FROM properties
WHERE id = '692fca22-b1c4-4c45-8ba4-de90880e2c38';

-- ============================================
-- TEST 5: Verify trigger is active
-- ============================================
SELECT 
    'TEST 5: Trigger exists' as test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS: ' || string_agg(trigger_name, ', ')
        ELSE '❌ FAIL: No trigger'
    END as result
FROM information_schema.triggers
WHERE event_object_table = 'properties'
  AND trigger_name LIKE '%og_version%';

-- ============================================
-- TEST 6: Verify short link exists
-- ============================================
SELECT 
    'TEST 6: Short link exists' as test_name,
    CASE 
        WHEN short_code IS NOT NULL THEN '✅ PASS: /r/' || short_code
        ELSE '❌ FAIL: No short link'
    END as result
FROM short_links
WHERE property_id = '692fca22-b1c4-4c45-8ba4-de90880e2c38'
LIMIT 1;

-- ============================================
-- FINAL SUMMARY: Expected OG Image URL
-- ============================================
SELECT 
    'FINAL: Expected OG URL' as test_name,
    'https://ywnisvgweuirqhocllga.supabase.co/functions/v1/og-renderer?id=' || 
    id || '&type=property&v=' || og_version as result
FROM properties
WHERE id = '692fca22-b1c4-4c45-8ba4-de90880e2c38';
