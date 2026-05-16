'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function setupFirstAdmin() {
  try {
    const phone = '9962293848';
    // Use a completely unique internal ID to bypass any stuck records
    const virtualEmail = `admin-setup-${Date.now()}@internal.db`;
    
    console.log('Starting ultra-resilient setup...');

    // 1. Deep Cleanup
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUsers = usersData?.users.filter(u => 
      u.email?.includes('admin') || 
      u.user_metadata?.phone_number === '+91' + phone
    ) || [];
    
    for (const u of existingUsers) {
      await supabaseAdmin.auth.admin.deleteUser(u.id);
    }

    await supabaseAdmin.from('profiles').delete().eq('phone_number', '+91' + phone);
    await supabaseAdmin.from('profiles').delete().ilike('email', '%admin%');

    // 2. Create User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: virtualEmail,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'System Admin',
        phone_number: '+91' + phone,
        role: 'admin'
      }
    });

    if (authError) {
      console.error('FULL AUTH ERROR:', JSON.stringify(authError, null, 2));
      throw authError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Setup error:', error);
    return { success: false, error: error.message };
  }
}
