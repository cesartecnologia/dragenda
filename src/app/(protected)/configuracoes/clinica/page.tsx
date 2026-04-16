import { redirect } from 'next/navigation';

import { PageContainer, PageContent, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { canAccessClinicSettings } from '@/lib/access';
import { requireSession } from '@/lib/auth';
import { getClinicById } from '@/server/clinic-data';

import ClinicSettingsForm from './_components/clinic-settings-form';

export default async function ConfiguracoesClinicaPage() {
  const session = await requireSession();
  if (!canAccessClinicSettings(session.user.role)) redirect('/agendamentos');
  const clinic = session.user.clinic?.id ? await getClinicById(session.user.clinic.id) : null;
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
