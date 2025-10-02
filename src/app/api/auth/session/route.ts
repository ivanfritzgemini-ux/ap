import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Expect body to contain tokens/session info from Supabase
    const { access_token, refresh_token, expires_at } = body || {};

    const response = NextResponse.json({ ok: true });

    if (!access_token) {
      // Clear cookies by setting empty value + maxAge=0
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
      
      response.cookies.set({ name: `sb-${projectRef}-auth-token`, value: '', path: '/', httpOnly: true, maxAge: 0 });
      response.cookies.set({ name: 'sb-access-token', value: '', path: '/', httpOnly: true, maxAge: 0 });
      response.cookies.set({ name: 'sb-refresh-token', value: '', path: '/', httpOnly: true, maxAge: 0 });
      return response;
    }

    // Set cookies securely using Supabase default naming convention
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    
    response.cookies.set({ 
      name: `sb-${projectRef}-auth-token`, 
      value: JSON.stringify({
        access_token,
        refresh_token,
        expires_at,
        expires_in: expires_at ? expires_at - Math.floor(Date.now() / 1000) : 3600,
        token_type: 'bearer',
        user: null // This will be populated by Supabase
      }), 
      path: '/', 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // Also set the legacy cookies for backward compatibility
    response.cookies.set({ name: 'sb-access-token', value: access_token, path: '/', httpOnly: true });
    if (refresh_token) response.cookies.set({ name: 'sb-refresh-token', value: refresh_token, path: '/', httpOnly: true });

    return response;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
