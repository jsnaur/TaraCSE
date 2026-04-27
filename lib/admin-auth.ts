import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function verifyAdminStatus(): Promise<boolean> {
  const cookieStore = await cookies();
  
  const authCookie = cookieStore.get("sb-access-token");
  
  if (!authCookie || !authCookie.value) {
    console.error('❌ AdminAuth failed: "sb-access-token" cookie is missing.');
    return false;
  }

  const accessToken = authCookie.value;

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
          Authorization: `Bearer ${accessToken}`
        },
        // FIX: Prevent Next.js from caching the database response for this user
        // This guarantees we always get the live 'is_admin' status from the DB.
        fetch: (url, options) => {
          return fetch(url, { ...options, cache: 'no-store' });
        }
      }
    }
  );

  try {
    console.log('\n--- ADMIN AUTH CHECK START ---');
    
    // 1. Fetch user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('❌ AdminAuth failed: Could not authenticate user via cookie.', authError?.message);
      return false;
    }
    
    console.log('✅ Authenticated as:', user.email);

    // 2. Fetch profile using the token-injected client
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ AdminAuth failed: Error fetching profile.', profileError?.message);
      return false;
    }

    console.log('✅ Profile is_admin status:', profile.is_admin);
    console.log('--- ADMIN AUTH CHECK END ---\n');

    return profile.is_admin === true;
  } catch (error) {
    console.error('❌ Unexpected error verifying admin status:', error);
    return false;
  }
}