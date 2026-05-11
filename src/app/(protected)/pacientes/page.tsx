import { Search, UsersRound } from 'lucide-react';

import DebouncedSearchForm from '@/components/common/debounced-search-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageActions, PageContainer, PageContent, PageDescription, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { requireSubscribedSession } from '@/lib/auth';
import { listRecentPatientsByClinicId, searchPatientsByClinicId } from '@/server/clinic-data';

import AddPatientButton from './_components/add-patient-button';
import PatientsDataTable from './_components/patients-data-table';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function PacientesPage({ searchParams }: Props) {
  const session = await requireSubscribedSession();
  const { q = '' } = await searchParams;
  const patients = q ? await searchPatientsByClinicId(session.user.clinic!.id, q) : await listRecentPatientsByClinicId(session.user.clinic!.id, 20);

  return (
    <PageContainer>
      <PageHeader className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <PageHeaderContent>
          <PageTitle>Base de pacientes</PageTitle>
          <PageDescription>Centralize cadastro, contato e histórico com visão rápida da sua base ativa.</PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddPatientButton />
        </PageActions>
      </PageHeader>

      <PageContent className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div>
            <p className="section-title !text-[10px] !text-slate-500">Pacientes listados</p>
            <p className="mt-1 text-3xl font-bold tracking-[0.02em] text-slate-900">{patients.length}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <UsersRound className="size-5" />
          </div>
        </div>

        <Card>
          <CardHeader className="border-b border-slate-200 bg-slate-50">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <Search className="size-4 text-slate-500" />
              Busca rapida
            </CardTitle>
          </CardHeader>
          <CardContent className="py-5">
            <DebouncedSearchForm placeholder="Digite nome, telefone ou email do paciente" initialValue={q} />
          </CardContent>
        </Card>

        <PatientsDataTable data={patients} role={session.user.role} />

        {!patients.length ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">Nenhum paciente encontrado para os filtros atuais.</CardContent>
          </Card>
        ) : null}
      </PageContent>
    </PageContainer>
  );
}


