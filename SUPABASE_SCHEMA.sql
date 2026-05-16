-- 🏢 Property Management App - Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Properties Table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'apartment', -- apartment, house, commercial, villa
  total_units INTEGER DEFAULT 1,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_managers UUID[] DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Update RLS Policies
DROP POLICY IF EXISTS "Users and assigned managers can manage properties" ON properties;
CREATE POLICY "Users and assigned managers can manage properties" ON properties
  FOR ALL USING (auth.uid() = owner_id OR auth.uid() = ANY(assigned_managers));

-- 2. Tenants Table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT NOT NULL,
  aadhar_id TEXT,
  address TEXT,
  emergency_contact TEXT,
  emergency_contact_name TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT,
  monthly_rent DECIMAL(12, 2) NOT NULL,
  security_deposit DECIMAL(12, 2) NOT NULL,
  move_in_date DATE NOT NULL,
  move_out_date DATE,
  agreement_start_date DATE,
  agreement_end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  document_urls TEXT[] DEFAULT '{}',
  agreement_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Invoices Table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  
  -- Billing Components
  rent_amount DECIMAL(12, 2) NOT NULL,
  water_charges DECIMAL(12, 2) DEFAULT 0,
  prev_electricity_reading DECIMAL(12, 2) DEFAULT 0,
  curr_electricity_reading DECIMAL(12, 2) DEFAULT 0,
  electricity_rate DECIMAL(12, 2) DEFAULT 0,
  misc_charges DECIMAL(12, 2) DEFAULT 0,
  previous_balance DECIMAL(12, 2) DEFAULT 0,
  
  -- Billing Period
  billing_period_start DATE,
  billing_period_end DATE,
  
  -- Totals
  amount DECIMAL(12, 2) NOT NULL, -- Total amount due
  billing_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, overdue
  description TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies

-- Properties: Users can only see/edit their own properties
CREATE POLICY "Users can manage their own properties" ON properties
  FOR ALL USING (auth.uid() = owner_id);

-- Tenants: Owners and assigned managers can manage tenants
DROP POLICY IF EXISTS "Users can manage tenants of their properties" ON tenants;
CREATE POLICY "Users and managers can manage tenants" ON tenants
  FOR ALL USING (
    property_id IN (
      SELECT id FROM properties 
      WHERE owner_id = auth.uid() 
      OR auth.uid() = ANY(assigned_managers)
    )
  );

-- Invoices: Owners and assigned managers can manage invoices
DROP POLICY IF EXISTS "Users can manage invoices of their properties" ON invoices;
DROP POLICY IF EXISTS "Users and managers can manage invoices" ON invoices;
CREATE POLICY "Users and managers can manage invoices" ON invoices
  FOR ALL USING (
    property_id IN (
      SELECT id FROM properties 
      WHERE owner_id = auth.uid() 
      OR auth.uid() = ANY(assigned_managers)
    )
  );

-- 6. Functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. Storage Policies for tenant-agreements bucket
-- Note: Run these in Supabase SQL Editor after creating the bucket

-- Allow Owners and Managers to upload files
CREATE POLICY "Managers can upload agreements"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-agreements' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM properties 
    WHERE owner_id = auth.uid() 
    OR auth.uid() = ANY(assigned_managers)
  )
);

-- Allow Owners and Managers to view files
CREATE POLICY "Managers can view agreements"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tenant-agreements' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM properties 
    WHERE owner_id = auth.uid() 
    OR auth.uid() = ANY(assigned_managers)
  )
);
