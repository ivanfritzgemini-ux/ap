"use client";

import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { BookOpen } from "lucide-react";

export function MobileHeader() {
  const { openMobile } = useSidebar();
  if (openMobile) {
    return null;
  }
  return (
    <header className="md:hidden flex items-center justify-between p-2 border-b">
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6" />
        <span className="text-xl font-headline font-semibold">CampusConnect</span>
      </div>
      <SidebarTrigger />
    </header>
  );
}
