"use client";

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "../theme-toggle"
import { Bell, PanelLeftClose, PanelLeftOpen, UserCircle, LogOut } from "lucide-react"
import { useSidebar } from "../ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface UserNavProps {
  user: User;
}

export function UserNav({ user }: UserNavProps) {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };
  
  if (state === 'collapsed' && !isMobile) {
    return (
      <div className="flex flex-col items-center gap-2 p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">Notificaciones</TooltipContent>
        </Tooltip>

       <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
              <UserCircle className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">Mi Cuenta</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">Cerrar Sesión</TooltipContent>
        </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={toggleSidebar}>
            <PanelLeftOpen />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">Expandir Menú</TooltipContent>
      </Tooltip>
      </div>
    )
  }

  return (
    <div className="space-y-1 p-2">
      <div className="p-2">
        <p className="text-sm font-medium">{user.email}</p>
      </div>
      <Button variant="ghost" className="w-full justify-start items-center gap-3 p-2 h-auto">
        <Bell className="h-5 w-5" />
        <span>Notificaciones</span>
      </Button>
      <Button variant="ghost" className="w-full justify-start items-center gap-3 p-2 h-auto">
        <UserCircle className="h-5 w-5" />
        <span>Mi Cuenta</span>
      </Button>
       <Button variant="ghost" className="w-full justify-start items-center gap-3 p-2 h-auto" onClick={handleLogout}>
        <LogOut className="h-5 w-5" />
        <span>Cerrar Sesión</span>
      </Button>
      <Button variant="ghost" className="w-full justify-start items-center gap-3 p-2 h-auto" onClick={toggleSidebar}>
        {isMobile ? <PanelLeftClose className="h-5 w-5" /> : (state === 'expanded' ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />)}
        <span>{isMobile ? 'Cerrar Menú' : (state === 'expanded' ? 'Contraer Menú' : 'Expandir Menú')}</span>
      </Button>
    </div>
  )
}
