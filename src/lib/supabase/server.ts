import { createServerClient as _createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerClient() {
  // cookies() returns a RequestCookies object in Next.js; to satisfy types we use a light wrapper
  const cookieStore = await cookies()

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get?.(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set?.({ name, value, ...options }) } catch (e) { /* best-effort */ }
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set?.({ name, value: '', ...options }) } catch (e) { /* best-effort */ }
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
