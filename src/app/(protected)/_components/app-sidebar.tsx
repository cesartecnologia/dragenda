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
  'min-h-[46px] gap-3 rounded-2xl px-3.5 py-2.5 text-[14px] font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:bg-slate-900 data-[active=true]:text-white data-[active=true]:shadow-sm [&>svg]:size-[18px]';

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
        canAccessClinicSettings(role) ? { title: 'Configurações', url: '/configuracoes/clinica', icon: Settings2 } : null,
      ]
    : [
        canAccessClinicSettings(role) ? { title: 'Configurações', url: '/configuracoes/clinica', icon: Settings2 } : null,
      ]).filter(Boolean) as { title: string; url: string; icon: ComponentType<{ className?: string }> }[];

  useEffect(() => {
    const urls = [...new Set([...menuItems.map((item) => item.url), '/agendamentos', '/pacientes', '/medicos'])];
    urls.forEach((url) => router.prefetch(url));
    if (canAccessFinancial(role)) router.prefetch('/assinatura');
  }, [menuItems, router, role]);

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
    <Sidebar variant="floating" className="p-3">
      <SidebarHeader className="rounded-[1.75rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="space-y-4">
          <Image src="/logo.svg" alt="Dr. Agenda" width={136} height={28} priority />
          <div className="rounded-2xl bg-slate-50 px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Clínica</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">{session.user.clinic?.name ?? 'Configuração inicial'}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{session.user.email}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="mt-3 rounded-[1.75rem] border border-slate-200 bg-white px-2 py-3 shadow-sm">
        <SidebarGroup className="px-1 pt-1">
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 px-2">
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

        {canAccessFinancial(role) || !hasFullAccess ? (
          <SidebarGroup className="px-1 pt-2">
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Conta
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5 px-2">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/assinatura'} className={navButtonClass}>
                    <Link href="/assinatura" prefetch>
                      <Gem />
                      <span>Assinatura</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="mt-3 rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="h-auto rounded-2xl px-3 py-3 hover:bg-slate-50">
                  <Avatar className="size-10 border border-slate-200">
                    <AvatarFallback className="bg-slate-100 text-slate-700">{session.user.name?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-left leading-tight">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900" title={session.user.name}>{session.user.name}</p>
                      {session.user.role === 'master' ? <ShieldCheck className="size-4 shrink-0 text-slate-500" /> : null}
                      {session.user.role === 'support' ? <LifeBuoy className="size-4 shrink-0 text-slate-500" /> : null}
                      {session.user.role === 'admin' ? <BriefcaseMedical className="size-4 shrink-0 text-slate-500" /> : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">{roleLabel[session.user.role]}</Badge>
                      {session.user.bypassSubscription ? <Badge className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Acesso livre</Badge> : null}
                    </div>
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
