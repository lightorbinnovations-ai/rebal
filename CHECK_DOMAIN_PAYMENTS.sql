SELECT id, paystack_reference, amount, status, metadata, created_at, paid_at
FROM payments
WHERE metadata->>'payment_type' = 'domain'
ORDER BY created_at DESC
LIMIT 5;
