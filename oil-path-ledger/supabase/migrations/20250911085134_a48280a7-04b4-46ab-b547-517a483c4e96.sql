-- Add wallet_address field to users table
ALTER TABLE public.users 
ADD COLUMN wallet_address TEXT;

-- Add index for wallet lookups
CREATE INDEX idx_users_wallet_address ON public.users(wallet_address);