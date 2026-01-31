-- Add SEO fields to properties table
ALTER TABLE public.properties
ADD COLUMN meta_title TEXT,
ADD COLUMN meta_description TEXT,
ADD COLUMN keywords TEXT[];