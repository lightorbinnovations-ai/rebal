SELECT id, business_name, selected_domain, selected_extension, status, paid_at, created_at
FROM domain_requests
WHERE selected_domain LIKE '%latest%'
ORDER BY created_at DESC
LIMIT 5;
