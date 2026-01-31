-- Create admin notifications log table
CREATE TABLE public.admin_notifications_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  recipient TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view notification logs
CREATE POLICY "Super admins can view notification logs"
ON public.admin_notifications_log
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Create index for efficient querying
CREATE INDEX idx_admin_notifications_log_type ON public.admin_notifications_log(type);
CREATE INDEX idx_admin_notifications_log_created_at ON public.admin_notifications_log(created_at DESC);