-- Drop the company_profiles view which is deprecated and potentially unsafe
-- The public_company_profiles table is the correct way to expose public company data
-- The companies table is properly protected with RLS for owner-only access

DROP VIEW IF EXISTS public.company_profiles;