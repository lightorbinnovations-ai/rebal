-- Add status and phone columns to inquiries table for better lead management
ALTER TABLE public.inquiries 
ADD COLUMN status text NOT NULL DEFAULT 'New' 
CHECK (status IN ('New', 'Viewed', 'Responded'));

ALTER TABLE public.inquiries 
ADD COLUMN phone text;

-- Allow owners to update inquiry status
CREATE POLICY "Owners can update their inquiries" 
ON public.inquiries 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = inquiries.company_id 
  AND companies.user_id = auth.uid()
));