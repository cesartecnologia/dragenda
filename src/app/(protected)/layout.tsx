import { headers } from 'next/headers';
import { ShieldCheck } from 'lucide-react';
import { redirect } from 'next/navigation';

import SupportFloatButton from '@/components/common/support-float-button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { formatClinicAddress } from '@/helpers/format';
import { hasPrivilegedAccess, requireSession } from '@/lib/auth';
import { getClinicById } from '@/server/clinic-data';

import { AppSidebar } from './_components/app-sidebar';
import ClinicBrandHeader from './_components/clinic-brand-header';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const headerStore = await headers();
  const pathname = headerStore.get('x-pathname') ?? '';
  const isClinicSettingsRoute = pathname.startsWith('/configuracoes/clinica');

  if (session.user.mustChangePassword) {
    redirect('/primeiro-login');
  }

  const clinic = session.user.clinic ? await getClinicById(session.user.clinic.id) : null;
  const privileged = hasPrivilegedAccess(session);

  if (!session.user.hasSubscriptionAccess && !privileged) {
    redirect('/assinatura');
  }

  if (!session.user.clinic && !isClinicSettingsRoute) {
    redirect('/configuracoes/clinica?onboarding=1');
  }

  if (!session.user.clinic) {
    return <main className="min-h-screen bg-slate-50/60">{children}</main>;
  }

  return (
    <SidebarProvider>
      <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#d9efea_0%,#b9dfdc_45%,#b3dedd_100%)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float-orb absolute left-[-6rem] top-[-4rem] h-[24rem] w-[24rem] rounded-full bg-white/18 blur-3xl" />
          <div className="animate-float-orb absolute bottom-[-8rem] right-[-3rem] h-[28rem] w-[28rem] rounded-full bg-[#7ec7c8]/20 blur-3xl [animation-delay:1.5s]" />
          <div className="animate-float-orb absolute left-1/2 top-1/4 h-[18rem] w-[18rem] -translate-x-1/2 rounded-full bg-[#c8ece8]/30 blur-3xl [animation-delay:0.8s]" />
        </div>

        <div className="relative flex min-h-screen">
          <AppSidebar session={session} />

          <main className="flex min-h-screen w-full flex-1 p-4 md:p-5">
            <div className="glass-surface flex min-h-[calc(100vh-2rem)] w-full flex-col rounded-[34px] shadow-[0_28px_80px_rgba(15,23,42,0.12)]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-4 md:px-6">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="size-10 rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-none hover:bg-[#f7fbfa] hover:text-slate-900" />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Painel da clínica</p>
                    <p className="text-sm font-semibold text-slate-900">{clinic.name}</p>
                  </div>
                </div>

                <div className="hidden items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 text-sm text-slate-600 md:flex">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>Ambiente seguro</span>
                </div>
              </div>

              <div className="flex-1 overflow-x-hidden">
                <ClinicBrandHeader
                  clinic={{
                    name: clinic.name,
                    cnpj: clinic.cnpj,
                    phoneNumber: clinic.phoneNumber,
                    address: clinic.address,
                    addressNumber: clinic.addressNumber,
                    addressComplement: clinic.addressComplement,
                    province: clinic.province,
                    postalCode: clinic.postalCode,
                    logoUrl: clinic.logoUrl,
                  }}
                />
                {children}
              </div>
            </div>
          </main>
        </div>
        <SupportFloatButton clinicName={clinic.name ?? formatClinicAddress(clinic)} />
      </div>
    </SidebarProvider>
  );
}
