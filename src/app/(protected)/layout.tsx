import { requireSession } from '@/lib/auth';
import { getClinicById } from '@/server/clinic-data';

import ProtectedRouteShell from './_components/protected-route-shell';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const clinic = session.user.clinic ? await getClinicById(session.user.clinic.id) : null;

  return (
    <ProtectedRouteShell
      session={session}
      clinic={clinic ? {
        name: clinic.name,
        cnpj: clinic.cnpj,
        phoneNumber: clinic.phoneNumber,
        address: clinic.address,
        logoUrl: clinic.logoUrl,
      } : null}
    >
      {children}
    </ProtectedRouteShell>
  );
}
