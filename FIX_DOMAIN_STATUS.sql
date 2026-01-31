-- Manually update the domain request status to paid
UPDATE domain_requests
SET 
  status = 'paid',
  paid_at = '2026-01-30 13:32:58+00'
WHERE id = '0c73b5f8-d915-41e7-ba4f-37d9fadaeccf';
