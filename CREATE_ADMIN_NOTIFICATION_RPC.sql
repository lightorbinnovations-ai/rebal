-- Function to allow admins to send notifications to any user
CREATE OR REPLACE FUNCTION admin_send_notification(
  p_user_id UUID,
  p_company_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Insert the notification
  INSERT INTO notifications (
    user_id,
    company_id,
    type,
    title,
    message,
    metadata,
    created_at,
    is_read
  ) VALUES (
    p_user_id,
    p_company_id,
    p_type,
    p_title,
    p_message,
    p_metadata,
    NOW(),
    false
  )
  RETURNING id INTO v_notification_id;

  RETURN jsonb_build_object('success', true, 'id', v_notification_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users (so admins can call it)
GRANT EXECUTE ON FUNCTION admin_send_notification TO authenticated;
