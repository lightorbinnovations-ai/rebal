-- Add super_admin SELECT policy for companies table
CREATE POLICY "Super admins can view all companies"
ON public.companies
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add super_admin UPDATE policy for companies table
CREATE POLICY "Super admins can update all companies"
ON public.companies
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add super_admin SELECT policy for properties table
CREATE POLICY "Super admins can view all properties"
ON public.properties
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add super_admin UPDATE policy for properties table  
CREATE POLICY "Super admins can update all properties"
ON public.properties
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));