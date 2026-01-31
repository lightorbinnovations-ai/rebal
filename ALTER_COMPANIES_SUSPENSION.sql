-- Add is_suspended column to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

-- Add updated_at trigger if not handles automatically (it usually is)
-- Grant permissions (if needed, though usually automatic for owner/admin)
