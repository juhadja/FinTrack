"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface AppHeaderProps {
  userName?: string;
  userLastName?: string;
  showBackButton?: boolean;
}

export function AppHeader({
  userName,
  userLastName,
  showBackButton = false,
}: AppHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center p-4 border-b border-primary/30 justify-between px-4 sm:px-6 lg:px-10">
      <div className="flex gap-2 items-center xl:hidden">
        <SidebarTrigger size="lg" />
        <h1 className="text-xl sm:text-2xl font-bold text-primary">
            FinTrack
          </h1>
          {showBackButton ? (
            <button
              onClick={() => router.back()}
              className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2 ml-45"
            >
              <ArrowLeft size={20} />
              {/* <span className="text-sm font-medium">Voltar</span> */}
            </button>
          ) : null}
          
      </div>
      <div className="hidden xl:flex gap-2 items-center">
        {showBackButton && (
          <button
            onClick={() => router.back()}
            className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2 mr-4"
          >
            <ArrowLeft size={20} />
            {/* <span className="text-sm font-medium">Voltar</span> */}
          </button>
        )}
        <h1 className="text-2xl font-bold text-primary">FinTrack</h1>
      </div>
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
