-- Rename oil_type column to product_type for generic supply chain
ALTER TABLE batches RENAME COLUMN oil_type TO product_type;

-- Add merkle_root column to store Merkle tree root hash for batch verification
ALTER TABLE batches ADD COLUMN merkle_root text;

-- Add merkle_proof column to movements for verification
ALTER TABLE movements ADD COLUMN merkle_proof jsonb;

-- Add comment to explain the new columns
COMMENT ON COLUMN batches.merkle_root IS 'Merkle tree root hash for batch verification';
COMMENT ON COLUMN batches.product_type IS 'Type of product in the supply chain (generic)';
COMMENT ON COLUMN movements.merkle_proof IS 'Merkle proof path for movement verification';