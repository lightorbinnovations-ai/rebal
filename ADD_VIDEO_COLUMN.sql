-- Add video_url column to properties table if it doesn't exist
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' AND column_name = 'video_url';
