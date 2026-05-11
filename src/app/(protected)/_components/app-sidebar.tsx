'use client';

import { useCallback, useMemo, useRef, useState, type ComponentType } from 'react';

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
import { canAccessClinicSettings, canAccessDashboard, canAccessFinancial, canAccessReports, canAccessUserManagement } from '@/lib/access';

type NavItem = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
};

const navButtonClass =
  "group min-h-[50px] gap-3 rounded-2xl border border-transparent px-3.5 py-3 text-[15px] font-medium text-slate-600 transition-all duration-300 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:bg-slate-100 data-[active=true]:text-slate-950 [&>svg]:size-[18px]";

export function AppSidebar({ session }: { session: AppSession }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = session.user.role;
  const hasFullAccess = session.user.hasSubscriptionAccess || session.user.bypassSubscription;
  const [isSigningOut, setIsSigningOut] = useState(false);
  const prefetchedRoutesRef = useRef(new Set<string>());

  const mainMenu = useMemo(
    () =>
      [
        canAccessDashboard(role) ? { title: 'Painel', url: '/painel', icon: LayoutDashboard } : null,
        { title: 'Agendamentos', url: '/agendamentos', icon: CalendarDays },
        { title: 'Médicos', url: '/medicos', icon: Stethoscope },
        { title: 'Pacientes', url: '/pacientes', icon: UsersRound },
      ].filter(Boolean) as NavItem[],
    [role],
  );

  const managementMenu = useMemo(
    () =>
      (hasFullAccess
        ? [
            canAccessReports(role) ? { title: 'Relatórios', url: '/relatorios', icon: FileText } : null,
            canAccessUserManagement(role) ? { title: 'Usuários', url: '/funcionarios', icon: Users } : null,
            canAccessClinicSettings(role) ? { title: 'Configurações', url: '/configuracoes/clinica', icon: Settings2 } : null,
          ]
        : [canAccessClinicSettings(role) ? { title: 'Configurações', url: '/configuracoes/clinica', icon: Settings2 } : null]).filter(
        Boolean,
      ) as NavItem[],
    [hasFullAccess, role],
  );

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      // Defer firebase/auth bundle to sign-out click, reducing protected routes initial JS.
      const { authClient } = await import('@/lib/auth-client');
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.replace('/login');
            router.refresh();
          },
        },
      });
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, router]);

  const handlePrefetch = useCallback(
    (route: string) => {
      if (prefetchedRoutesRef.current.has(route)) return;
      prefetchedRoutesRef.current.add(route);
      router.prefetch(route);
    },
    [router],
  );

  return (
    <Sidebar variant="floating" className="py-3 pl-3 md:py-4 md:pl-4">
      <SidebarHeader className="border-b border-slate-100/80 bg-white/90 px-6 pb-5 pt-7">
        <Link
          href="/painel"
          prefetch={false}
          onMouseEnter={() => handlePrefetch('/painel')}
          onFocus={() => handlePrefetch('/painel')}
          className="inline-flex items-center"
        >
          <Image src="/logo.svg" alt="Dr. Agenda" width={118} height={30} priority className="h-auto w-[118px]" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="bg-white/90 px-3 py-4">
        <SidebarGroup className="pt-1">
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-1.5">
              {mainMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} className={navButtonClass}>
                    <Link
                      href={item.url}
                      prefetch={false}
                      onMouseEnter={() => handlePrefetch(item.url)}
                      onFocus={() => handlePrefetch(item.url)}
                    >
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
              {managementMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} className={navButtonClass}>
                    <Link
                      href={item.url}
                      prefetch={false}
                      onMouseEnter={() => handlePrefetch(item.url)}
                      onFocus={() => handlePrefetch(item.url)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {canAccessFinancial(role) || !hasFullAccess ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/assinatura'} className={navButtonClass}>
                    <Link
                      href="/assinatura"
                      prefetch={false}
                      onMouseEnter={() => handlePrefetch('/assinatura')}
                      onFocus={() => handlePrefetch('/assinatura')}
                    >
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
            <button className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-slate-100">
              <Avatar className="size-11 rounded-2xl border border-white bg-white shadow-[0_10px_20px_rgba(125,160,220,0.10)]">
                <AvatarFallback className="rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
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
              {isSigningOut ? 'Saindo...' : 'Sair'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
