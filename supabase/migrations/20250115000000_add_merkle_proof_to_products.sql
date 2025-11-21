-- Add merkle_proof column to products table for storing Merkle proof data
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS merkle_proof jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN public.products.merkle_proof IS 'Merkle proof data (leaf, proof array, root) for product verification';

