import SupportFloatButton from '@/components/common/support-float-button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { requireSession } from '@/lib/auth';
import { getClinicById } from '@/server/clinic-data';

import { AppSidebar } from './_components/app-sidebar';
import ClinicBrandHeader from './_components/clinic-brand-header';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const clinic = session.user.clinic ? await getClinicById(session.user.clinic.id) : null;

  return (
    <SidebarProvider>
      <AppSidebar session={session} />
      <main className="w-full bg-slate-50/60">
        <div className="flex items-center justify-between px-4 pt-4 md:px-6">
          <SidebarTrigger className="rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-primary/5 hover:text-primary" />
        </div>
        <ClinicBrandHeader clinic={clinic ? {
          name: clinic.name,
          cnpj: clinic.cnpj,
          phoneNumber: clinic.phoneNumber,
          address: clinic.address,
          addressNumber: clinic.addressNumber,
          addressComplement: clinic.addressComplement,
          province: clinic.province,
          postalCode: clinic.postalCode,
          logoUrl: clinic.logoUrl,
        } : null} />
        {children}
        <SupportFloatButton clinicName={clinic?.name} />
      </main>
    </SidebarProvider>
  );
}
