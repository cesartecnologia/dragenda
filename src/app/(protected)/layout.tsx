import { headers } from 'next/headers';
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
      <AppSidebar session={session} />
      <main className="min-h-screen w-full overflow-x-hidden bg-slate-50/60">
        <div className="flex items-center justify-between px-3 pt-3 sm:px-4 md:px-6 md:pt-4">
          <SidebarTrigger className="rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-primary/5 hover:text-primary" />
        </div>
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
        <SupportFloatButton clinicName={clinic.name ?? formatClinicAddress(clinic)} />
      </main>
    </SidebarProvider>
  );
}
