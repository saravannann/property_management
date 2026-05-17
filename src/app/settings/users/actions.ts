'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function createNewUser(formData: {
  fullName: string;
  phone: string;
  role: string;
}) {
  try {
    let phone = formData.phone.trim();
    
    // Auto-format Indian numbers if 10 digits are entered
    if (/^\d{10}$/.test(phone)) {
      phone = '+91' + phone;
    } else if (!phone.startsWith('+')) {
      if (/^\d+$/.test(phone)) {
        phone = '+' + phone;
      }
    }

    const virtualEmail = `${phone.replace('+', '')}@mobile.user`;

    // Get lazy-initialized admin client
    const adminClient = getSupabaseAdmin();

    // 1. Create user in Supabase Auth using Admin API
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: virtualEmail,
      password: 'password123', // Default temporary password
      email_confirm: true,
      user_metadata: {
        full_name: formData.fullName,
        phone_number: phone,
        role: formData.role
      }
    });

    if (authError) throw authError;

    // Note: The public.profiles entry should be automatically created by the trigger
    // but the trigger might need the phone_number from metadata.
    // We already updated the trigger in a previous step to handle this.

    revalidatePath('/settings/users');
    return { success: true, user: authUser.user };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteUser(userId: string) {
  try {
    const adminClient = getSupabaseAdmin();

    // Delete user from Supabase Auth using Admin service client
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    // Delete corresponding profile just in case cascade trigger is not present
    await adminClient.from('profiles').delete().eq('id', userId);

    revalidatePath('/settings/users');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
}


