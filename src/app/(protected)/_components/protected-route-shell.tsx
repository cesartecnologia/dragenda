'use client';

import { useEffect, type ReactNode } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import SupportFloatButton from '@/components/common/support-float-button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import type { AppSession } from '@/lib/auth';

import { AppSidebar } from './app-sidebar';
import ClinicBrandHeader from './clinic-brand-header';

type ClinicPreview = {
  name: string;
  cnpj: string | null;
  phoneNumber: string | null;
  address: string | null;
  logoUrl: string | null;
} | null;

interface ProtectedRouteShellProps {
  children: ReactNode;
  session: AppSession;
  clinic: ClinicPreview;
}

export default function ProtectedRouteShell({ children, session, clinic }: ProtectedRouteShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isClinicSettingsRoute = pathname?.startsWith('/configuracoes/clinica') ?? false;
  const hasClinic = Boolean(session.user.clinic?.id);
  const hasFullAccess = Boolean(session.user.bypassSubscription || session.user.hasSubscriptionAccess);
  const mustCompleteClinic = !hasClinic && !session.user.bypassSubscription;
  const mustSubscribe = !hasFullAccess;

  const redirectTarget = mustCompleteClinic ? '/configuracoes/clinica' : mustSubscribe ? '/assinatura' : null;
  const canRenderMinimalShell = Boolean(redirectTarget && isClinicSettingsRoute);

  useEffect(() => {
    if (redirectTarget && !canRenderMinimalShell && pathname !== redirectTarget) {
      router.replace(redirectTarget);
    }
  }, [canRenderMinimalShell, pathname, redirectTarget, router]);

  if (redirectTarget && !canRenderMinimalShell) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center">
        <div className="max-w-md space-y-2">
          <p className="text-lg font-semibold text-slate-900">Redirecionando…</p>
          <p className="text-sm text-slate-600">
            {mustSubscribe
              ? 'Sua clínica precisa de assinatura ativa para acessar o sistema.'
              : 'Complete o cadastro da clínica para continuar.'}
          </p>
        </div>
      </main>
    );
  }

  if (canRenderMinimalShell) {
    return <main className="min-h-screen bg-slate-50/60">{children}</main>;
  }

  return (
    <SidebarProvider>
      <AppSidebar session={session} />
      <main className="w-full bg-slate-50/60">
        <div className="flex items-center justify-between px-4 pt-4 md:px-6">
          <SidebarTrigger className="rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-primary/5 hover:text-primary" />
        </div>
        <ClinicBrandHeader clinic={clinic} />
        {children}
        <SupportFloatButton clinicName={clinic?.name} />
      </main>
    </SidebarProvider>
  );
}
