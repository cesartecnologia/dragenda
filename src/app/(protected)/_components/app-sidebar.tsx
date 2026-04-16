'use client';

import type { ComponentType } from 'react';
import { useEffect } from 'react';

import {
  BriefcaseMedical,
  CalendarDays,
  FileText,
  Gem,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Settings2,
  ShieldCheck,
  Stethoscope,
  Users,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/sidebar';
import type { AppSession } from '@/lib/auth';
import { authClient } from '@/lib/auth-client';
import { canAccessClinicSettings, canAccessDashboard, canAccessFinancial, canAccessReports, canAccessUserManagement } from '@/lib/access';

const roleLabel: Record<AppSession['user']['role'], string> = {
  master: 'Master',
  support: 'Suporte',
  owner: 'Proprietário',
  admin: 'Admin',
  attendant: 'Atendente',
};

const navButtonClass =
  'relative min-h-[46px] gap-3 rounded-2xl px-3.5 py-2.5 text-[14px] font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 data-[active=true]:bg-[#eef4ff] data-[active=true]:text-slate-950 data-[active=true]:before:absolute data-[active=true]:before:left-2.5 data-[active=true]:before:top-1/2 data-[active=true]:before:h-5 data-[active=true]:before:w-[3px] data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:rounded-full data-[active=true]:before:bg-[#2563eb] [&>svg]:size-[18px]';

const utilityButtonClass =
  'min-h-[42px] gap-3 rounded-2xl px-3 text-[14px] font-medium text-slate-500 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 [&>svg]:size-[17px]';

export function AppSidebar({ session }: { session: AppSession }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = session.user.role;
  const hasFullAccess = session.user.hasSubscriptionAccess || session.user.bypassSubscription;

  const menuItems = (hasFullAccess
    ? [
        canAccessDashboard(role) ? { title: 'Painel', url: '/painel', icon: LayoutDashboard } : null,
        { title: 'Agendamentos', url: '/agendamentos', icon: CalendarDays },
        { title: 'Médicos', url: '/medicos', icon: Stethoscope },
        { title: 'Pacientes', url: '/pacientes', icon: UsersRound },
        canAccessReports(role) ? { title: 'Relatórios', url: '/relatorios', icon: FileText } : null,
        canAccessUserManagement(role) ? { title: 'Usuários', url: '/funcionarios', icon: Users } : null,
      ]
    : []).filter(Boolean) as { title: string; url: string; icon: ComponentType<{ className?: string }> }[];

  const managementItems = [
    canAccessClinicSettings(role) ? { title: 'Configurações', url: '/configuracoes/clinica', icon: Settings2 } : null,
    canAccessFinancial(role) || !hasFullAccess ? { title: 'Assinatura', url: '/assinatura', icon: Gem } : null,
  ].filter(Boolean) as { title: string; url: string; icon: ComponentType<{ className?: string }> }[];

  const utilityItems = [
    canAccessClinicSettings(role) ? { title: 'Preferências', url: '/configuracoes/clinica', icon: Settings2 } : null,
    canAccessReports(role) ? { title: 'Resumo e relatórios', url: '/relatorios', icon: FileText } : null,
  ].filter(Boolean) as { title: string; url: string; icon: ComponentType<{ className?: string }> }[];

  useEffect(() => {
    const urls = [...new Set([...menuItems.map((item) => item.url), ...managementItems.map((item) => item.url), ...utilityItems.map((item) => item.url), '/agendamentos', '/pacientes', '/medicos'])];
    urls.forEach((url) => router.prefetch(url));
  }, [managementItems, menuItems, router, utilityItems]);

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
    <Sidebar variant="floating" className="p-3 md:left-4 md:top-4 md:bottom-4 md:h-[calc(100svh-2rem)] md:py-0">
      <SidebarHeader className="rounded-[1.9rem] border border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50">
            <Image src="/logo.svg" alt="Dr. Agenda" width={28} height={28} priority className="h-7 w-auto" />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-2">
              <p className="truncate text-lg font-semibold tracking-tight text-slate-900">Dr. Agenda</p>
              {session.user.bypassSubscription ? (
                <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50">
                  Livre
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-500">Gestão diária da sua clínica</p>
          </div>
        </div>

        <div className="mt-4 rounded-[1.35rem] border border-slate-100 bg-slate-50/80 px-3.5 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Clínica ativa</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
            {session.user.clinic?.name ?? 'Configuração inicial'}
          </p>
          <p className="mt-1 truncate text-xs text-slate-500">{session.user.email}</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="mt-3 rounded-[1.9rem] border border-slate-200/80 bg-white/95 px-2 py-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.22)] backdrop-blur">
        {menuItems.length ? (
          <SidebarGroup className="px-1 pt-1">
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5 px-2 pt-1.5">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url} className={navButtonClass}>
                      <Link href={item.url} prefetch>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {managementItems.length ? (
          <SidebarGroup className="mt-3 border-t border-slate-100 px-1 pt-4">
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Gestão
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5 px-2 pt-1.5">
                {managementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url} className={navButtonClass}>
                      <Link href={item.url} prefetch>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {utilityItems.length ? (
          <SidebarGroup className="mt-auto border-t border-slate-100 px-1 pt-4">
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Atalhos
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5 px-2 pt-1.5">
                {utilityItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className={utilityButtonClass}>
                      <Link href={item.url} prefetch>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="mt-3 rounded-[1.9rem] border border-slate-200/80 bg-white/95 p-2 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.22)] backdrop-blur">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="h-auto rounded-[1.35rem] border border-slate-100 bg-slate-50/80 px-3 py-3 hover:bg-slate-50">
                  <Avatar className="size-11 border border-slate-200 bg-white">
                    <AvatarFallback className="bg-white text-sm font-semibold text-slate-700">
                      {session.user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-left leading-tight">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900" title={session.user.name}>
                        {session.user.name}
                      </p>
                      {session.user.role === 'master' ? <ShieldCheck className="size-4 shrink-0 text-slate-400" /> : null}
                      {session.user.role === 'support' ? <LifeBuoy className="size-4 shrink-0 text-slate-400" /> : null}
                      {session.user.role === 'admin' ? <BriefcaseMedical className="size-4 shrink-0 text-slate-400" /> : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{roleLabel[session.user.role]}</p>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
