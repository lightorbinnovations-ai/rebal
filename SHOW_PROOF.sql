-- RUN THIS TO SEE THE ACTUAL NOTIFICATION ROW
SELECT 
    id,
    type,
    subject,
    status,
    created_at,
    metadata
FROM 
    public.admin_notifications_log
ORDER BY 
    created_at DESC
LIMIT 5;
