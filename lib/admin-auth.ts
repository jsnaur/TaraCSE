// lib/admin-auth.ts
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Server-side utility to verify if the currently authenticated user is an admin.
 * Queries the profiles table to check the is_admin flag.
 */
export async function verifyAdminStatus(): Promise<boolean> {
  const cookieStore = await cookies();
  
  // Initialize standard client for checking current user session
  // Adjust cookie access based on your standard auth configuration if needed
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          // Pass the cookies manually to authenticate the server request
          Cookie: cookieStore.toString(),
        },
      },
    }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return false;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return false;
    }

    return profile.is_admin === true;
  } catch (error) {
    console.error('Error verifying admin status:', error);
    return false;
  }
}