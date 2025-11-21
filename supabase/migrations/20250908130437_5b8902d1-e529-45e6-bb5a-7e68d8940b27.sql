-- Create custom role enum
CREATE TYPE public.user_role AS ENUM ('manufacturer', 'distributor', 'retailer', 'consumer');

-- Create movement status enum
CREATE TYPE public.movement_status AS ENUM ('created', 'in_transit', 'received');

-- Create users table (profiles for authenticated users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create batches table
CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code TEXT NOT NULL UNIQUE,
  oil_type TEXT NOT NULL,
  production_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  manufacturer_id UUID NOT NULL REFERENCES public.users(id),
  blockchain_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create movements table
CREATE TABLE public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  from_user UUID NOT NULL REFERENCES public.users(id),
  to_user UUID NOT NULL REFERENCES public.users(id),
  location TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status movement_status DEFAULT 'created',
  blockchain_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create consumer_scans table
CREATE TABLE public.consumer_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES public.users(id),
  scan_time TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for batches table
CREATE POLICY "All users can view batches" ON public.batches FOR SELECT USING (true);
CREATE POLICY "Manufacturers can create batches" ON public.batches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'manufacturer')
);
CREATE POLICY "Manufacturers can update own batches" ON public.batches FOR UPDATE USING (
  manufacturer_id = auth.uid()
);

-- RLS Policies for movements table
CREATE POLICY "All users can view movements" ON public.movements FOR SELECT USING (true);
CREATE POLICY "Users can create movements involving them" ON public.movements FOR INSERT WITH CHECK (
  auth.uid() = from_user OR auth.uid() = to_user
);
CREATE POLICY "Users can update movements involving them" ON public.movements FOR UPDATE USING (
  auth.uid() = from_user OR auth.uid() = to_user
);

-- RLS Policies for consumer_scans table
CREATE POLICY "Users can view their own scans" ON public.consumer_scans FOR SELECT USING (consumer_id = auth.uid());
CREATE POLICY "Consumers can create scans" ON public.consumer_scans FOR INSERT WITH CHECK (
  consumer_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'consumer')
);

-- Create indexes for better performance
CREATE INDEX idx_batches_manufacturer_id ON public.batches(manufacturer_id);
CREATE INDEX idx_batches_batch_code ON public.batches(batch_code);
CREATE INDEX idx_movements_batch_id ON public.movements(batch_id);
CREATE INDEX idx_movements_from_user ON public.movements(from_user);
CREATE INDEX idx_movements_to_user ON public.movements(to_user);
CREATE INDEX idx_consumer_scans_batch_id ON public.consumer_scans(batch_id);
CREATE INDEX idx_consumer_scans_consumer_id ON public.consumer_scans(consumer_id);

-- Trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_movements_updated_at BEFORE UPDATE ON public.movements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'consumer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();