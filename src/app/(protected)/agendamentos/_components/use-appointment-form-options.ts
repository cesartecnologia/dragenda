'use client';

import { useCallback, useMemo, useState } from 'react';

import type { doctorsTable, patientsTable } from '@/db/schema';

type PatientOption = Pick<typeof patientsTable.$inferSelect, 'id' | 'name' | 'phoneNumber' | 'sex'>;
type DoctorOption = Pick<
  typeof doctorsTable.$inferSelect,
  'id' | 'name' | 'specialty' | 'appointmentPriceInCents' | 'availableFromWeekDay' | 'availableToWeekDay' | 'availabilityRanges'
>;

type OptionsPayload = {
  patients: PatientOption[];
  doctors: DoctorOption[];
};

export function useAppointmentFormOptions(initial?: Partial<OptionsPayload>) {
  const [patients, setPatients] = useState<PatientOption[]>(initial?.patients ?? []);
  const [doctors, setDoctors] = useState<DoctorOption[]>(initial?.doctors ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasOptions = patients.length > 0 && doctors.length > 0;

  const ensureLoaded = useCallback(async () => {
    if (hasOptions || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/appointments/form-options', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Não foi possível carregar os dados do agendamento.');
      }

      const payload = (await response.json()) as OptionsPayload;
      setPatients(payload.patients ?? []);
      setDoctors(payload.doctors ?? []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Não foi possível carregar os dados do agendamento.');
      throw fetchError;
    } finally {
      setIsLoading(false);
    }
  }, [hasOptions, isLoading]);

  return useMemo(
    () => ({
      patients,
      doctors,
      isLoading,
      error,
      hasOptions,
      ensureLoaded,
    }),
    [patients, doctors, isLoading, error, hasOptions, ensureLoaded],
  );
}
