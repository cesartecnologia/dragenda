import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import SupportFloatButton from '@/components/common/support-float-button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { hasPrivilegedAccess, requireSession } from '@/lib/auth';
import { getClinicById } from '@/server/clinic-data';

import { AppSidebar } from './_components/app-sidebar';

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
      <div className="relative min-h-screen w-screen max-w-none overflow-x-hidden bg-[linear-gradient(135deg,#eef5ff_0%,#e0efff_36%,#d8ebff_68%,#d3e7ff_100%)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float-orb absolute left-[-8rem] top-[-6rem] h-[26rem] w-[26rem] rounded-full bg-white/28 blur-3xl" />
          <div className="animate-float-orb absolute bottom-[-10rem] right-[-5rem] h-[30rem] w-[30rem] rounded-full bg-[#cfe4ff]/55 blur-3xl [animation-delay:1.5s]" />
          <div className="animate-float-orb absolute left-1/2 top-1/3 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-[#dfeeff]/60 blur-3xl [animation-delay:0.8s]" />
        </div>

        <div className="relative flex min-h-screen w-full max-w-none">
          <AppSidebar session={session} />

          <main className="flex min-h-screen min-w-0 flex-[1_1_auto] basis-0 p-2 md:p-3 lg:p-4">
            <div className="relative flex min-h-[calc(100vh-1rem)] w-full max-w-none min-w-0 flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white/74 shadow-[0_20px_50px_rgba(125,160,220,0.14)] backdrop-blur-xl md:min-h-[calc(100vh-1.5rem)]">
              <div className="sticky top-0 z-20 flex justify-start p-4 md:hidden">
                <SidebarTrigger className="size-10 rounded-2xl border border-white/80 bg-white/94 text-slate-700 shadow-[0_10px_22px_rgba(125,160,220,0.12)] hover:bg-white" />
              </div>
              <div className="min-w-0 flex-1 overflow-x-hidden">{children}</div>
            </div>
          </main>
        </div>

        <SupportFloatButton clinicName={clinic?.name ?? 'Clínica'} />
      </div>
    </SidebarProvider>
  );
}
