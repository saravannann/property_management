import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Admin features will not work.');
}

// This client has admin privileges and should ONLY be used in Server Components or Server Actions
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
