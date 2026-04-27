// lib/admin-auth.ts
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function verifyAdminStatus(): Promise<boolean> {
  const cookieStore = await cookies();
  
  // Robust cookie serialization for Next.js 16
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          // Manually passing the reconstructed cookie string
          Cookie: cookieHeader,
        },
      },
    }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('AdminAuth: Invalid or missing session', authError?.message);
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