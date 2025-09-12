import { SidebarProvider, Sidebar, SidebarInset, SidebarFooter, SidebarContent, SidebarTrigger } from "@/components/ui/sidebar"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { BookOpen } from "lucide-react"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient();

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

  // Aseguramos que el tipo de dato sea correcto y extraemos el nombre_rol
  const roleData = userData?.roles as { nombre_rol: string } | null;
  const userRole = roleData?.nombre_rol || 'student';


  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              <span className="text-xl font-headline font-semibold group-data-[state=collapsed]:hidden">CampusConnect</span>
            </div>
             <SidebarTrigger className="md:hidden" />
          </div>
          <SidebarContent>
            <SidebarNav userRole={userRole} />
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
