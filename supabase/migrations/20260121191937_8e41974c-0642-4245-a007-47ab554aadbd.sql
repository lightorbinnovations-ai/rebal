-- Add status column to properties table for more granular status tracking
ALTER TABLE public.properties 
ADD COLUMN status text NOT NULL DEFAULT 'Available' 
CHECK (status IN ('Available', 'Sold', 'Reserved', 'Under Offer'));