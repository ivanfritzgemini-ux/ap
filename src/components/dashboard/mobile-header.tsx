"use client";

import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { EstablishmentLogo } from "@/components/establishment-logo";

export function MobileHeader() {
  const { openMobile } = useSidebar();
  if (openMobile) {
    return null;
  }
  return (
    <header className="md:hidden flex items-center justify-between p-2 border-b">
      <div className="flex items-center gap-2">
  <EstablishmentLogo className="h-6" />
  <span className="text-xl font-headline font-semibold">Polivalente Digital</span>
      </div>
      <SidebarTrigger />
    </header>
  );
}
