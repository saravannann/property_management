'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function createNewUser(formData: {
  fullName: string;
  phone: string;
  role: string;
}) {
  try {
    const phone = formData.phone.trim();
    const virtualEmail = `${phone.replace('+', '')}@mobile.user`;

    // 1. Create user in Supabase Auth using Admin API
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
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
