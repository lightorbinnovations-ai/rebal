-- Create RPC function to mark admin notifications as read
CREATE OR REPLACE FUNCTION mark_admin_notification_read(notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_notifications_log
  SET status = 'read'
  WHERE id = notification_id;
END;
$$;
