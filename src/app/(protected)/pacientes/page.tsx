import { PageActions, PageContainer, PageContent, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { requireSubscribedSession } from '@/lib/auth';
import { listRecentPatientsByClinicId, searchPatientsByClinicId } from '@/server/clinic-data';

import DebouncedSearchForm from '@/components/common/debounced-search-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AddPatientButton from '../patients/_components/add-patient-button';
import PatientsDataTable from '../patients/_components/patients-data-table';

interface Props { searchParams: Promise<{ q?: string }> }

export default async function PacientesPage({ searchParams }: Props) {
  const session = await requireSubscribedSession();
  const { q = '' } = await searchParams;
  const patients = q ? await searchPatientsByClinicId(session.user.clinic!.id, q) : await listRecentPatientsByClinicId(session.user.clinic!.id, 20);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Pacientes</PageTitle>
        </PageHeaderContent>
        <PageActions><AddPatientButton /></PageActions>
      </PageHeader>
      <PageContent className="space-y-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Busca rápida</CardTitle></CardHeader>
          <CardContent>
            <DebouncedSearchForm placeholder="Digite o nome do paciente para buscar" initialValue={q} />
          </CardContent>
        </Card>
        <PatientsDataTable data={patients} role={session.user.role} />
        {!patients.length ? <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum paciente encontrado.</CardContent></Card> : null}
      </PageContent>
    </PageContainer>
  );
}
