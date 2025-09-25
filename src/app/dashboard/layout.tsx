import { SidebarProvider, Sidebar, SidebarInset, SidebarFooter, SidebarContent, SidebarTrigger } from "@/components/ui/sidebar"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { EstablishmentLogo } from "@/components/establishment-logo"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Consulta actualizada para obtener el rol desde las tablas usuarios y roles
  const { data: userData } = await supabase
    .from('usuarios')
    .select(`
      roles (
        nombre_rol
      )
    `)
    .eq('id', user.id)
    .single();

  // 'roles' relationship may come as an array or an object depending on the query
  const rolesRaw = (userData as any)?.roles;
  let userRole: string = 'student';
  if (Array.isArray(rolesRaw)) {
    userRole = rolesRaw[0]?.nombre_rol ?? 'student';
  } else if (rolesRaw && typeof rolesRaw === 'object') {
    userRole = (rolesRaw as any).nombre_rol ?? 'student';
  }
  // Trim whitespace/newlines
  userRole = String(userRole ?? '').trim();
  const normalizeRole = (r: string) => {
    const s = (r || '').toString().toLowerCase().trim();
    if (s.includes('admin')) return 'administrator';
    if (s.includes('teacher') || s.includes('profesor')) return 'teacher';
    if (s.includes('parent') || s.includes('padre') || s.includes('madre')) return 'parent';
    if (s.includes('student') || s.includes('estudiante') || s.includes('alumno')) return 'student';
    return s || 'student';
  }
  const normalizedRole = normalizeRole(userRole);


  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EstablishmentLogo className="h-6" />
              <span className="text-xl font-headline font-semibold group-data-[state=collapsed]:hidden">Polivalente Digital</span>
            </div>
             <SidebarTrigger className="md:hidden" />
          </div>
          <SidebarContent>
            <SidebarNav userRole={normalizedRole} />
          </SidebarContent>
          <SidebarFooter>
            <UserNav user={user} />
          </SidebarFooter>
        </div>
      </Sidebar>
      <SidebarInset>
        <MobileHeader />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
