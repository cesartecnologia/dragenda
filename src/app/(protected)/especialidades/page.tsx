import Link from 'next/link';

import DebouncedSearchForm from '@/components/common/debounced-search-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageActions, PageContainer, PageContent, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { requireSubscribedSession } from '@/lib/auth';
import { normalizeSearchText } from '@/helpers/format';
import { listSpecialtiesByClinicId, searchSpecialtiesByClinicId } from '@/server/clinic-data';

import AddSpecialtyButton from './_components/add-specialty-button';
import SpecialtiesDataTable from './_components/specialties-data-table';

export const dynamic = 'force-dynamic';

interface Props { searchParams: Promise<{ q?: string }> }

export default async function EspecialidadesPage({ searchParams }: Props) {
  const session = await requireSubscribedSession();
  const { q = '' } = await searchParams;
  const normalized = normalizeSearchText(q);
  const filtered = normalized
    ? await searchSpecialtiesByClinicId(session.user.clinic!.id, q)
    : await listSpecialtiesByClinicId(session.user.clinic!.id);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Especialidades</PageTitle>
        </PageHeaderContent>
        <PageActions>
          <Button variant="outline" asChild><Link href="/medicos">Voltar para médicos</Link></Button>
          <AddSpecialtyButton />
        </PageActions>
      </PageHeader>
      <PageContent className="space-y-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Busca rápida</CardTitle></CardHeader>
          <CardContent><DebouncedSearchForm placeholder="Digite a especialidade" initialValue={q} /></CardContent>
        </Card>
        <SpecialtiesDataTable data={filtered} role={session.user.role} />
      </PageContent>
    </PageContainer>
  );
}
