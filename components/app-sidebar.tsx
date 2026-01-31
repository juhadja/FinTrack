"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  DollarSign,
  TrendingDown,
  ChevronDown,
  Home,
  Landmark,
  Tags,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import LogoutButton from "@/components/logoutButton";
import Link from "next/link";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-none ">
      <SidebarHeader className="p-4 border-b border-primary/20 mb-5">
        <Link href="/home" className="flex items-center gap-3">
          <Image src="/logo.svg" alt="FinTrack" width={32} height={32} />
          {/* <span className="text-xl font-bold text-primary">FinTrack</span> */}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/home"}>
                  <Link href="/home">
                    <Home />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Entradas */}
              <Collapsible
                defaultOpen={
                  pathname.startsWith("/home/entradas") ||
                  pathname.startsWith("/home/fontes-renda")
                }
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <DollarSign />
                      <span>Entradas</span>
                      <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === "/home/entradas"}
                        >
                          <Link href="/home/entradas">
                            <DollarSign />
                            <span>Entradas</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === "/home/fontes-renda"}
                        >
                          <Link href="/home/fontes-renda">
                            <Landmark />
                            <span>Fontes de Renda</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Gastos */}
              <Collapsible
                defaultOpen={
                  pathname.startsWith("/home/gastos") ||
                  pathname.startsWith("/home/categorias-gastos")
                }
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <TrendingDown />
                      <span>Gastos</span>
                      <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === "/home/gastos"}
                        >
                          <Link href="/home/gastos">
                            <TrendingDown />
                            <span>Gastos</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === "/home/categorias-gastos"}
                        >
                          <Link href="/home/categorias-gastos">
                            <Tags />
                            <span>Categorias de Gastos</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  );
}
