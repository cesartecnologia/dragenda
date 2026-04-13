import { redirect } from 'next/navigation';

import { requireSession } from '@/lib/auth';
import { getDefaultPostLoginRoute, hasPrivilegedAccess } from '@/lib/auth';
import { getClinicById } from '@/server/clinic-data';

export default async function PosLoginPage() {
  const session = await requireSession();

  if (session.user.mustChangePassword) {
    redirect('/primeiro-login');
  }

  if (hasPrivilegedAccess(session)) {
    redirect('/painel');
  }

  if (!session.user.clinic?.id) {
    redirect('/configuracoes/clinica?onboarding=1');
  }

  const clinic = await getClinicById(session.user.clinic.id);

  const onboardingComplete = Boolean(
    clinic?.name &&
      clinic?.cnpj &&
      clinic?.phoneNumber &&
      clinic?.address &&
      clinic?.addressNumber &&
      clinic?.postalCode &&
      clinic?.province,
  );

  if (!onboardingComplete) {
    redirect('/configuracoes/clinica?onboarding=1');
  }

  if (!session.user.hasSubscriptionAccess) {
    redirect('/assinatura?firstAccess=1');
  }

  redirect(getDefaultPostLoginRoute(session.user.role));
}
