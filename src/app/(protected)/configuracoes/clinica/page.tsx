import { redirect } from 'next/navigation';

import { PageContainer, PageContent, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { canAccessClinicSettings } from '@/lib/access';
import { requireSession } from '@/lib/auth';
import { getClinicById } from '@/server/clinic-data';

import ClinicSettingsForm from './_components/clinic-settings-form';

export default async function ConfiguracoesClinicaPage() {
  const session = await requireSession();
  const hasClinic = Boolean(session.user.clinic?.id);

  // During onboarding (no clinic yet), allow access regardless of role to avoid redirect loops.
  if (hasClinic && !canAccessClinicSettings(session.user.role)) redirect('/agendamentos');

  const clinic = hasClinic ? await getClinicById(session.user.clinic!.id) : null;
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Configurações da clínica</PageTitle>
        </PageHeaderContent>
      </PageHeader>
      <PageContent><ClinicSettingsForm clinic={clinic} bypassSubscription={session.user.bypassSubscription} /></PageContent>
    </PageContainer>
  );
}
