import { NextResponse } from 'next/server';

import { getServerSession } from '@/lib/auth';
import { listDoctorsByClinicId, listPatientsByClinicId } from '@/server/clinic-data';

export async function GET() {
  const session = await getServerSession();
  const clinicId = session?.user?.clinic?.id;

  if (!session?.user || !clinicId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [patients, doctors] = await Promise.all([
    listPatientsByClinicId(clinicId),
    listDoctorsByClinicId(clinicId),
  ]);

  return NextResponse.json(
    {
      patients: patients.map((patient) => ({
        id: patient.id,
        name: patient.name,
        phoneNumber: patient.phoneNumber,
        sex: patient.sex,
      })),
      doctors: doctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        appointmentPriceInCents: doctor.appointmentPriceInCents,
        availableFromWeekDay: doctor.availableFromWeekDay,
        availableToWeekDay: doctor.availableToWeekDay,
        availabilityRanges: doctor.availabilityRanges ?? [],
      })),
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    },
  );
}
