import { createServerClient as createServerClientOriginal, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!supabaseKey) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createServerClientOriginal(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Mutating cookies is only allowed inside Server Actions or Route Handlers.
            // Wrap in try/catch to avoid crashing when code runs in a context where
            // cookie mutations are not permitted (e.g., during SSR render).
            cookieStore.set({ name, value, ...options })
          } catch (e) {
            // Log a helpful warning rather than throwing. For correct auth flows
            // consider performing session cookie updates inside a Route Handler /
            // Server Action as recommended by Next.js docs.
            // https://nextjs.org/docs/app/api-reference/functions/cookies#options
            // eslint-disable-next-line no-console
            console.warn('[supabase] Unable to set cookie in this context:', e)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[supabase] Unable to remove cookie in this context:', e)
          }
        },
      },
    }
  )
}
