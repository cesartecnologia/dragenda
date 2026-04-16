'use client';

import type { ComponentType } from 'react';

import {
  CalendarDays,
  FileText,
  Gem,
  LayoutDashboard,
  LogOut,
  Settings2,
  Stethoscope,
  Users,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import type { AppSession } from '@/lib/auth';
import { authClient } from '@/lib/auth-client';
import { canAccessClinicSettings, canAccessDashboard, canAccessFinancial, canAccessReports, canAccessUserManagement } from '@/lib/access';

const navButtonClass =
  "group min-h-[50px] gap-3 rounded-2xl border border-transparent px-3.5 py-3 text-[15px] font-medium text-slate-600 transition-all duration-300 hover:bg-[#f5f8ff] hover:text-slate-900 data-[active=true]:bg-[linear-gradient(135deg,#edf4ff_0%,#f7faff_100%)] data-[active=true]:text-slate-950 data-[active=true]:shadow-[0_12px_24px_rgba(125,160,220,0.12)] [&>svg]:size-[18px]";

export function AppSidebar({ session }: { session: AppSession }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = session.user.role;
  const hasFullAccess = session.user.hasSubscriptionAccess || session.user.bypassSubscription;

  const mainMenu = [
    canAccessDashboard(role) ? { title: 'Painel', url: '/painel', icon: LayoutDashboard } : null,
    { title: 'Agendamentos', url: '/agendamentos', icon: CalendarDays },
    { title: 'Médicos', url: '/medicos', icon: Stethoscope },
    { title: 'Pacientes', url: '/pacientes', icon: UsersRound },
  ].filter(Boolean) as { title: string; url: string; icon: ComponentType<{ className?: string }> }[];

  const managementMenu = (hasFullAccess
    ? [
        canAccessReports(role) ? { title: 'Relatórios', url: '/relatorios', icon: FileText } : null,
        canAccessUserManagement(role) ? { title: 'Usuários', url: '/funcionarios', icon: Users } : null,
        canAccessClinicSettings(role) ? { title: 'Configurações', url: '/configuracoes/clinica', icon: Settings2 } : null,
      ]
    : [canAccessClinicSettings(role) ? { title: 'Configurações', url: '/configuracoes/clinica', icon: Settings2 } : null]).filter(Boolean) as {
    title: string;
    url: string;
    icon: ComponentType<{ className?: string }>;
  }[];

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace('/login');
          router.refresh();
        },
      },
    });
  };

  return (
    <Sidebar variant="floating" className="py-3 pl-3 md:py-4 md:pl-4">
      <SidebarHeader className="border-b border-slate-100/80 bg-white/90 px-6 pb-5 pt-7">
        <Link href="/painel" className="inline-flex items-center">
          <Image src="/logo.svg" alt="Dr. Agenda" width={118} height={30} priority className="h-auto w-[118px]" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="bg-white/90 px-3 py-4">
        <SidebarGroup className="pt-1">
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-1.5">
              {mainMenu.map((item, index) => (
                <SidebarMenuItem key={item.title} style={{ animationDelay: `${index * 60}ms` }} className="animate-panel-fade-up">
                  <SidebarMenuButton asChild isActive={pathname === item.url} className={navButtonClass}>
                    <Link href={item.url} prefetch={false}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-3 my-3 bg-slate-100" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Conta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-1.5">
              {managementMenu.map((item, index) => (
                <SidebarMenuItem key={item.title} style={{ animationDelay: `${(index + mainMenu.length) * 60}ms` }} className="animate-panel-fade-up">
                  <SidebarMenuButton asChild isActive={pathname === item.url} className={navButtonClass}>
                    <Link href={item.url} prefetch={false}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {canAccessFinancial(role) || !hasFullAccess ? (
                <SidebarMenuItem style={{ animationDelay: `${(managementMenu.length + mainMenu.length) * 60}ms` }} className="animate-panel-fade-up">
                  <SidebarMenuButton asChild isActive={pathname === '/assinatura'} className={navButtonClass}>
                    <Link href="/assinatura" prefetch={false}>
                      <Gem />
                      <span>Assinatura</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-slate-100/80 bg-white/90 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-[#f5f8ff]">
              <Avatar className="size-11 rounded-2xl border border-white bg-white shadow-[0_10px_20px_rgba(125,160,220,0.10)]">
                <AvatarFallback className="rounded-2xl bg-[#eef4ff] text-sm font-semibold text-slate-700">
                  {session.user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900" title={session.user.name}>
                  {session.user.name}
                </p>
                <p className="truncate text-xs text-slate-500" title={session.user.email}>
                  {session.user.email}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl border-slate-200/80 p-2 shadow-[0_18px_42px_rgba(125,160,220,0.16)]">
            <DropdownMenuItem onClick={handleSignOut} className="rounded-xl px-3 py-2 text-sm">
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
