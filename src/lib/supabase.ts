import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getCurrentProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return profile as Profile;
};

export type Property = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  property_type: string;
  total_units: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'manager';
  avatar_url: string | null;
  created_at: string;
};

export type Tenant = {
  id: string;
  name: string;
  email: string | null;
  phone_number: string;
  aadhar_id: string | null;
  address: string | null;
  emergency_contact: string | null;
  emergency_contact_name: string | null;
  property_id: string;
  unit_number: string | null;
  monthly_rent: number;
  security_deposit: number;
  move_in_date: string;
  move_out_date: string | null;
  is_active: boolean;
  document_urls: string[];
  agreement_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  tenant_id: string;
  property_id: string;
  invoice_number: string;
  amount: number;
  billing_date: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  pdf_url: string | null;
  created_at: string;
};
