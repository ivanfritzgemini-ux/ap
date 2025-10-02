import { createServerClient as _createServerClient, type CookieOptions } from '@supabase/ssr'

export async function createServerClient() {
  let cookieStore: any = null;
  
  try {
    // Try to get cookies if available (works in server components)
    const { cookies } = await import('next/headers')
    cookieStore = await cookies()
  } catch (error) {
    // Fall back to no-op if cookies() is not available
    console.warn('Cookies not available, using fallback mode')
  }

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (cookieStore?.getAll) {
            return cookieStore.getAll()
          }
          return []
        },
        setAll(cookiesToSet) {
          if (cookieStore?.set) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          }
        },
      },
    }
  )
}

// Create a Supabase client using the service_role key (for admin actions like creating/deleting users).
// This client should NEVER be exposed to the browser.
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing SUPABASE_SERVICE_ROLE or SUPABASE_SERVICE_ROLE_KEY env var')
  const cookieMethods = {
    get() { return undefined },
    set() { /* no-op */ },
    delete() { /* no-op */ }
  }
  // @ts-ignore - satisfy expected cookies parameter
  return _createServerClient(url, key, { cookies: cookieMethods })
}
