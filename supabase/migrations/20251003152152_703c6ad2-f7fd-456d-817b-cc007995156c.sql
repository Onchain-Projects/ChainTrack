-- Create storage bucket for QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for QR codes bucket
CREATE POLICY "QR codes are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-codes');

CREATE POLICY "Authenticated users can upload QR codes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'qr-codes' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update their QR codes"
ON storage.objects FOR UPDATE
USING (bucket_id = 'qr-codes' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their QR codes"
ON storage.objects FOR DELETE
USING (bucket_id = 'qr-codes' AND auth.role() = 'authenticated');

-- Create products table to store individual product IDs and their QR codes
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  product_identifier TEXT NOT NULL,
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(batch_id, product_identifier)
);

-- Enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS policies for products
CREATE POLICY "All users can view products"
ON public.products FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create products"
ON public.products FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update products in their batches"
ON public.products FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.batches
    WHERE batches.id = products.batch_id
    AND batches.manufacturer_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_products_batch_id ON public.products(batch_id);
CREATE INDEX idx_products_identifier ON public.products(product_identifier);