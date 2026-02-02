"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

interface AppHeaderProps {
  userName?: string;
  userLastName?: string;
}

export function AppHeader({ userName, userLastName }: AppHeaderProps) {
  return (
    <header className="flex items-center p-4 border-b border-primary/30 justify-between px-4 sm:px-6 lg:px-10">
      <div className="flex gap-2 items-center xl:hidden">
        <SidebarTrigger size="lg" />
        <h1 className="text-xl sm:text-2xl font-bold text-primary">FinTrack</h1>
      </div>
      <h1 className="text-2xl font-bold text-primary hidden xl:block">FinTrack</h1>
      {userName && (
        <div className="hidden md:flex gap-2 items-center">
          <p className="text-sm">Bem vindo,</p>
          <Badge className="bg-foreground/20 text-foreground text-sm font-normal">
            <p className="mx-1">
              {userName} {userLastName}
            </p>
          </Badge>
        </div>
      )}
    </header>
  );
}
