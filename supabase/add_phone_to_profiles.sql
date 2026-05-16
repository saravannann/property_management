-- Add phone_number column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_number_idx ON public.profiles(phone_number);

-- Update handle_new_user function to include phone_number if available in metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone_number)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'manager'),
    new.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
