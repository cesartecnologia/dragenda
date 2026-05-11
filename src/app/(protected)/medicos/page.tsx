import { Suspense } from 'react';

import MedicosCatalogo from './_components/medicos-catalogo';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { requireClinicSession } from '@/lib/auth';
import { listDoctorsByClinicId, listSpecialtiesByClinicId } from '@/server/clinic-data';

function MedicosPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-3xl border border-slate-200 bg-white px-5 py-5 md:px-6">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <Card className="border-slate-200">
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-40 rounded-xl" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="overflow-hidden border-slate-200 bg-white">
            <CardHeader className="space-y-3 border-b border-slate-100 bg-slate-50 p-5">
              <Skeleton className="h-6 w-44 max-w-full" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

async function MedicosDataSection({
  sessionPromise,
}: {
  sessionPromise: ReturnType<typeof requireClinicSession>;
}) {
  const session = await sessionPromise;
  const clinicId = session.user.clinic!.id;

  const [doctors, specialties] = await Promise.all([
    listDoctorsByClinicId(clinicId),
    listSpecialtiesByClinicId(clinicId),
  ]);

  return <MedicosCatalogo doctors={doctors} specialties={specialties.map((item) => item.name)} />;
}

export default async function MedicosPage() {
  const sessionPromise = requireClinicSession();

  return (
    <PageContainer>
      <Suspense fallback={<MedicosPageSkeleton />}>
        <MedicosDataSection sessionPromise={sessionPromise} />
      </Suspense>
    </PageContainer>
  );
}
