-- Check if realtor_stats data exists
SELECT 
    rs.*,
    c.name as company_name,
    c.slug as company_slug
FROM realtor_stats rs
LEFT JOIN companies c ON c.id = rs.company_id
ORDER BY rs.created_at DESC
LIMIT 10;
