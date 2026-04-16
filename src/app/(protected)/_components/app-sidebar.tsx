'use client';

import type { ComponentType } from 'react';

import {
  BriefcaseMedical,
  Building2,
  CalendarDays,
  ChevronsUpDown,
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
  SidebarSeparator,
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
  "group relative min-h-[52px] gap-3.5 rounded-2xl border border-transparent px-3.5 py-3.5 text-[15px] font-medium leading-tight text-slate-600 transition-all duration-300 before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-primary before:opacity-0 before:transition-opacity before:content-[''] hover:border-slate-200/90 hover:bg-[#f7fbfa] hover:text-slate-900 data-[active=true]:border-[#d9e8e7] data-[active=true]:bg-[#eef5f5] data-[active=true]:text-slate-950 data-[active=true]:shadow-[0_16px_28px_rgba(15,23,42,0.06)] data-[active=true]:before:opacity-100 [&>svg]:size-[18px] [&>span:last-child]:whitespace-normal [&>span:last-child]:leading-tight";

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
    <Sidebar variant="floating" className="py-4 pl-4 md:py-5 md:pl-5">
      <SidebarHeader className="gap-0 rounded-t-[30px] border-b border-slate-200/80 bg-white/95 px-4 py-4">
        <div className="animate-panel-fade-up flex items-center gap-3 rounded-[24px] border border-slate-200/70 bg-[#f7fbfa] p-3.5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-[0_10px_18px_rgba(15,23,42,0.08)]">
            <Image src="/logo.svg" alt="Dr. Agenda" width={28} height={28} priority />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">Dr. Agenda</p>
            <div className="flex items-center gap-1.5">
              <p className="truncate text-base font-semibold text-slate-900" title={session.user.clinic?.name ?? 'Painel administrativo'}>
                {session.user.clinic?.name ?? 'Painel administrativo'}
              </p>
              <ChevronsUpDown className="size-4 text-slate-400" />
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="rounded-b-[30px] bg-white/95 px-2 py-3">
        <SidebarGroup className="pt-1">
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-2">
              {mainMenu.map((item, index) => (
                <SidebarMenuItem key={item.title} style={{ animationDelay: `${index * 70}ms` }} className="animate-panel-fade-up">
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

        <SidebarSeparator className="mx-4 my-2 bg-slate-200/80" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-2">
              {managementMenu.map((item, index) => (
                <SidebarMenuItem key={item.title} style={{ animationDelay: `${(index + mainMenu.length) * 70}ms` }} className="animate-panel-fade-up">
                  <SidebarMenuButton asChild isActive={pathname === item.url} className={navButtonClass}>
                    <Link href={item.url} prefetch={false}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {(canAccessFinancial(role) || !hasFullAccess) ? (
                <SidebarMenuItem style={{ animationDelay: `${(managementMenu.length + mainMenu.length) * 70}ms` }} className="animate-panel-fade-up">
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

      <SidebarFooter className="mt-3 rounded-[28px] border border-slate-200/80 bg-white/90 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-[22px] border border-transparent p-2.5 text-left transition-all duration-300 hover:border-slate-200 hover:bg-[#f7fbfa]">
              <Avatar className="size-12 rounded-2xl border border-white shadow-[0_10px_18px_rgba(15,23,42,0.08)]">
                <AvatarFallback className="rounded-2xl bg-[#eef5f5] text-slate-700">
                  {session.user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900" title={session.user.name}>
                    {session.user.name}
                  </p>
                  {session.user.role === 'master' ? <ShieldCheck className="size-4 shrink-0 text-primary" /> : null}
                  {session.user.role === 'support' ? <LifeBuoy className="size-4 shrink-0 text-primary" /> : null}
                  {session.user.role === 'admin' ? <BriefcaseMedical className="size-4 shrink-0 text-primary" /> : null}
                </div>
                <p className="truncate text-xs text-slate-500" title={session.user.email}>{session.user.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full bg-[#eef5f5] text-slate-700">
                    {roleLabel[session.user.role]}
                  </Badge>
                  {session.user.bypassSubscription ? (
                    <Badge className="rounded-full bg-primary/12 text-primary hover:bg-primary/12">
                      <Building2 className="mr-1 size-3.5" /> Sem cobrança
                    </Badge>
                  ) : null}
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl border-slate-200/80 p-2 shadow-[0_18px_42px_rgba(15,23,42,0.12)]">
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
