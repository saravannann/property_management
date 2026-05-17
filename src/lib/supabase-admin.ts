import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Admin features will not work.');
}

// This client has admin privileges and should ONLY be used in Server Components or Server Actions
let adminClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseAdmin = () => {
  if (adminClient) return adminClient;

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. Admin features will not work.');
  }

  adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return adminClient;
};

// Backwards compatibility export
export const supabaseAdmin = {
  get auth() {
    return getSupabaseAdmin().auth;
  },
  from(...args: Parameters<ReturnType<typeof createClient>['from']>) {
    return getSupabaseAdmin().from(...args);
  }
} as unknown as ReturnType<typeof createClient>;

