-- Add personal_bio column to companies table if it doesn't exist
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS personal_bio TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'companies' AND column_name = 'personal_bio';
