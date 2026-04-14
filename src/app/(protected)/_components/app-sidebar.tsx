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
  'min-h-[52px] gap-3 rounded-xl px-3.5 py-3.5 text-[15px] font-medium leading-tight transition-all duration-200 hover:bg-primary/5 hover:text-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-[0_10px_24px_rgba(37,99,235,0.18)] [&>svg]:size-[18px] [&>span:last-child]:whitespace-normal [&>span:last-child]:leading-tight';

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
    await authClient.signOut({ fetchOptions: { onSuccess: () => router.push('/login') } });
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b bg-white/90 p-4">
        <Image src="/logo.svg" alt="Dr. Agenda" width={136} height={28} priority />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2.5 px-3">
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
          <SidebarGroup className="pt-3">
            <SidebarGroupContent>
              <SidebarMenu className="gap-2.5 px-3">
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
      <SidebarFooter className="border-t bg-white/90">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="h-auto px-4 py-4">
                  <Avatar className="size-10">
                    <AvatarFallback>{session.user.name?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-left leading-tight">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-base font-semibold" title={session.user.name}>{session.user.name}</p>
                      {session.user.role === 'master' ? <ShieldCheck className="size-4 shrink-0 text-primary" /> : null}
                      {session.user.role === 'support' ? <LifeBuoy className="size-4 shrink-0 text-primary" /> : null}
                      {session.user.role === 'admin' ? <BriefcaseMedical className="size-4 shrink-0 text-primary" /> : null}
                    </div>
                    {session.user.clinic?.name ? <p className="text-muted-foreground truncate text-[14px]" title={session.user.clinic.name}>{session.user.clinic.name}</p> : null}
                    <p className="text-muted-foreground truncate text-[14px]" title={session.user.email}>{session.user.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{roleLabel[session.user.role]}</Badge>
                      {session.user.bypassSubscription ? <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Sem bloqueio</Badge> : null}
                    </div>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
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
