-- Fix: Add explicit deny policies for anonymous users to protect sensitive data

-- 1. Deny anonymous SELECT access to companies table (protects contact info and financial data)
CREATE POLICY "deny_anon_companies" 
ON public.companies 
FOR SELECT 
TO anon 
USING (false);

-- 2. Deny anonymous SELECT access to inquiries table (protects customer leads)
CREATE POLICY "deny_anon_inquiries" 
ON public.inquiries 
FOR SELECT 
TO anon 
USING (false);