-- Create a table for user profiles with roles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin', 'manager')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone in the organization
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- Only admins can update profile roles
CREATE POLICY "Admins can update profile roles" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'manager')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
