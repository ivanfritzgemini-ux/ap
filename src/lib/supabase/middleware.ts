import { createServerClient as createServerClientOriginal, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { RolePermissions, type Role } from '@/types/roles'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClientOriginal(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard']
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // If not authenticated and accessing protected path, redirect to login
  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If authenticated and accessing protected path, check role permissions
  if (user && isProtectedPath) {
    try {
      // Get user role from database
      const { data: profile } = await supabase
        .from('usuarios')
        .select('rol:rol_id(nombre_rol)')
        .eq('id', user.id)
        .single()

      if (profile?.rol) {
        const userRole = Array.isArray(profile.rol) 
          ? (profile.rol[0] as any)?.nombre_rol 
          : (profile.rol as any)?.nombre_rol

        // Normalize role names
        let normalizedRole: Role
        switch (userRole?.toLowerCase()) {
          case 'administrador':
          case 'admin':
            normalizedRole = 'admin'
            break
          case 'directivo':
          case 'director':
            normalizedRole = 'directivo'
            break
          case 'docente':
          case 'profesor':
          case 'teacher':
            normalizedRole = 'docente'
            break
          case 'apoyo':
          case 'support':
            normalizedRole = 'apoyo'
            break
          case 'apoderado':
          case 'parent':
          case 'guardian':
            normalizedRole = 'apoderado'
            break
          case 'estudiante':
          case 'student':
            normalizedRole = 'estudiante'
            break
          default:
            console.warn(`Unknown role: ${userRole}`)
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Check if user has permission for this route
        const allowedRoutes = RolePermissions[normalizedRole]?.routes || []
        const currentPath = request.nextUrl.pathname

        // Special check for admin routes - ONLY admins can access /admin paths
        if (currentPath.includes('/admin/') || currentPath.endsWith('/admin')) {
          if (normalizedRole !== 'admin') {
            console.warn(`SECURITY: Non-admin user (${normalizedRole}) attempted to access admin route: ${currentPath}`)
            return NextResponse.redirect(new URL('/access-denied?reason=admin_required', request.url))
          }
        }

        // Check if the current path is allowed for this role
        const hasAccess = allowedRoutes.some(route => {
          // Exact match or starts with for nested routes
          return currentPath === route || currentPath.startsWith(route + '/')
        })

        if (!hasAccess) {
          console.warn(`Access denied: ${normalizedRole} tried to access ${currentPath}`)
          // Redirect to user's appropriate dashboard
          const defaultRoute = allowedRoutes.find(route => route !== '/dashboard') || '/dashboard'
          return NextResponse.redirect(new URL(defaultRoute, request.url))
        }
      } else {
        // No role found, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      // On error, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}
