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
      <PageHeader className="border-[#2f394d] bg-[linear-gradient(140deg,#2d3748_0%,#242d3b_100%)] text-[#eef3fb]">
        <PageHeaderContent>
          <PageTitle className="text-[#f4f7fd]">Base de pacientes</PageTitle>
          <PageDescription className="text-[#aeb8cb]">Centralize cadastro, contato e histórico com visão rápida da sua base ativa.</PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddPatientButton />
        </PageActions>
      </PageHeader>

      <PageContent className="space-y-5">
        <div className="rounded-[14px] border border-[#334056] bg-[linear-gradient(150deg,#2b3547_0%,#232c3a_100%)] px-5 py-4 text-[#eef3fb] shadow-[0_16px_28px_rgba(13,18,28,0.3)]">
          <div>
            <p className="section-title !text-[10px] !text-[#aab5c8]">Pacientes listados</p>
            <p className="mt-1 text-3xl font-bold tracking-[0.02em] text-[#f5f8ff]">{patients.length}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#36435a] text-[#d6ab70]">
            <UsersRound className="size-5" />
          </div>
        </div>

        <Card>
          <CardHeader className="border-b border-[#d8c7aa]/90 bg-[linear-gradient(180deg,#f5e6ca_0%,#f1dfbf_100%)]">
            <CardTitle className="flex items-center gap-2 text-base text-[#2e241a]">
              <Search className="size-4 text-[#8f6330]" />
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
            <CardContent className="py-12 text-center text-sm text-[#7f725f]">Nenhum paciente encontrado para os filtros atuais.</CardContent>
          </Card>
        ) : null}
      </PageContent>
    </PageContainer>
  );
}


