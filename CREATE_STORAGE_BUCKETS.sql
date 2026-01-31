-- Create storage buckets for the application
-- This script safely creates buckets if they don't exist and sets up public access policies.

-- 1. Create 'property-images' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create 'company-logos' bucket (Standard requirement)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create 'property-documents' bucket (For verification docs, private by default)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-documents', 'property-documents', false)
ON CONFLICT (id) DO NOTHING;


-- =========================================================
-- POLICIES (Allow uploads and public viewing)
-- =========================================================

-- Enable RLS (Standard practice, though buckets are handled slightly differently)
-- storage.objects policies

-- A. Public Viewing (Images & Logos)
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id IN ('property-images', 'company-logos') );

-- B. Authenticated Uploads (Users can upload to their own folder)
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id IN ('property-images', 'company-logos') 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- C. Owners can update/delete their own files
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( (storage.foldername(name))[1] = auth.uid()::text )
WITH CHECK ( (storage.foldername(name))[1] = auth.uid()::text );

DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING ( (storage.foldername(name))[1] = auth.uid()::text );
