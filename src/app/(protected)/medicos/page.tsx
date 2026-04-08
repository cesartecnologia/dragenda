import MedicosCatalogo from './_components/medicos-catalogo';

import { requireSubscribedSession } from '@/lib/auth';
import { listDoctorsByClinicId, listSpecialtiesByClinicId } from '@/server/clinic-data';
import { PageContainer } from '@/components/ui/page-container';

export default async function MedicosPage() {
  const session = await requireSubscribedSession();
  const [doctors, specialties] = await Promise.all([
    listDoctorsByClinicId(session.user.clinic!.id),
    listSpecialtiesByClinicId(session.user.clinic!.id),
  ]);

  return (
    <PageContainer>
      <MedicosCatalogo doctors={doctors} specialties={specialties.map((item) => item.name)} />
    </PageContainer>
  );
}
