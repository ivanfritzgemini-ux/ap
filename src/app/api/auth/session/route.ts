import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Expect body to contain tokens/session info from Supabase
    const { access_token, refresh_token, expires_at } = body || {};

    const response = NextResponse.json({ ok: true });

    if (!access_token) {
      // Clear cookies by setting empty value + maxAge=0
      response.cookies.set({ name: 'sb-access-token', value: '', path: '/', httpOnly: true, maxAge: 0 });
      response.cookies.set({ name: 'sb-refresh-token', value: '', path: '/', httpOnly: true, maxAge: 0 });
      return response;
    }

    // Set cookies securely. Adjust names/flags to match your Supabase SSR expectations.
    response.cookies.set({ name: 'sb-access-token', value: access_token, path: '/', httpOnly: true });
    if (refresh_token) response.cookies.set({ name: 'sb-refresh-token', value: refresh_token, path: '/', httpOnly: true });

    // Optionally set expiry as maxAge
    if (expires_at) {
      const age = Math.max(0, Number(expires_at) - Math.floor(Date.now() / 1000));
      if (age > 0) response.cookies.set({ name: 'sb-access-token-expires', value: String(expires_at), path: '/', httpOnly: true, maxAge: age });
    }

    return response;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
