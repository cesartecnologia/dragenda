import { randomUUID } from 'crypto';

import dayjs from 'dayjs';
import {
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from 'firebase-admin/firestore';

import {
  appointmentsTable,
  clinicsTable,
  doctorsTable,
  employeesTable,
  patientsTable,
  specialtiesTable,
  usersTable,
} from '@/db/schema';
import { normalizeSearchText } from '@/helpers/format';
import { resolvePrivilegedAccess } from '@/lib/access';
import { getFirestoreDb } from '@/lib/firebase-admin';
import { invalidateServerCache, withServerCache } from '@/lib/server-cache';

type AppUser = typeof usersTable.$inferSelect;
type Clinic = typeof clinicsTable.$inferSelect;
type Doctor = typeof doctorsTable.$inferSelect;
type Patient = typeof patientsTable.$inferSelect;
type Appointment = typeof appointmentsTable.$inferSelect;
type Employee = typeof employeesTable.$inferSelect;
type Specialty = typeof specialtiesTable.$inferSelect;

export type AppointmentWithRelations = Appointment & {
  patient: Patient;
  doctor: Doctor;
};

const COLLECTIONS = {
  users: 'users',
  clinics: 'clinics',
  doctors: 'doctors',
  patients: 'patients',
  appointments: 'appointments',
  employees: 'employees',
  specialties: 'specialties',
} as const;

const chunk = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
};

const isTimestamp = (value: unknown): value is Timestamp => value instanceof Timestamp;

const normalizeFirestoreValue = <T,>(value: T): T => {
  if (isTimestamp(value)) return value.toDate() as T;
  if (Array.isArray(value)) return value.map((item) => normalizeFirestoreValue(item)) as T;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeFirestoreValue(item)]),
    ) as T;
  }
  return value;
};

const sanitizeFirestoreValue = (value: unknown): unknown => {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map((item) => sanitizeFirestoreValue(item));
  if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof Timestamp)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, sanitizeFirestoreValue(item)]),
    );
  }
  return value;
};

const fromDoc = <T,>(snapshot: DocumentSnapshot): T | null => {
  if (!snapshot.exists) return null;
  return normalizeFirestoreValue(snapshot.data() as T);
};

const fromQuery = <T,>(snapshot: QuerySnapshot): T[] => {
  return snapshot.docs
    .map((docSnapshot) => fromDoc<T>(docSnapshot))
    .filter((item): item is T => Boolean(item));
};

const deleteDocsInChunks = async (docs: QueryDocumentSnapshot[]) => {
  for (const docsChunk of chunk(docs, 400)) {
    const batch = getFirestoreDb().batch();
    for (const docSnapshot of docsChunk) batch.delete(docSnapshot.ref);
    await batch.commit();
  }
};

const sortByName = <T extends { name: string }>(items: T[]) => [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
const sortByDateDesc = <T extends { date: Date }>(items: T[]) => [...items].sort((a, b) => b.date.getTime() - a.date.getTime());
const sortByCreatedAtDesc = <T extends { createdAt: Date }>(items: T[]) => [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

const getEntitiesByIds = async <T,>(collectionName: string, ids: string[]) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return {} as Record<string, T>;
  const refs = uniqueIds.map((id) => getFirestoreDb().collection(collectionName).doc(id));
  const snapshots = await getFirestoreDb().getAll(...refs);
  return snapshots.reduce<Record<string, T>>((acc, snapshot) => {
    const entity = fromDoc<T>(snapshot);
    if (entity) acc[snapshot.id] = entity;
    return acc;
  }, {});
};

const inDateRange = (value: Date, start: Date, end: Date) => {
  const time = value.getTime();
  return time >= start.getTime() && time <= end.getTime();
};

const isActiveAppointment = (appointment: Appointment | AppointmentWithRelations) => appointment.status !== 'cancelled';

const invalidateClinicScopedCache = (clinicId?: string | null) => {
  if (!clinicId) return;
  invalidateServerCache(`clinic:${clinicId}`);
};

const invalidateDoctorScopedCache = (doctorId?: string | null) => {
  if (!doctorId) return;
  invalidateServerCache(`doctor:${doctorId}`);
};

const invalidateUserScopedCache = (userId?: string | null) => {
  if (!userId) return;
  invalidateServerCache(`user:${userId}`);
};

export const getUserProfileById = async (userId: string): Promise<AppUser | null> => {
  return withServerCache(`user:${userId}`, 60_000, async () => {
    const snapshot = await getFirestoreDb().collection(COLLECTIONS.users).doc(userId).get();
    return fromDoc<AppUser>(snapshot);
  });
};

export const findUserProfileByAsaasCustomerId = async (asaasCustomerId: string): Promise<AppUser | null> => {
  const snapshot = await getFirestoreDb()
    .collection(COLLECTIONS.users)
    .where('asaasCustomerId', '==', asaasCustomerId)
    .limit(1)
    .get();
  const [user] = fromQuery<AppUser>(snapshot);
  return user ?? null;
};

export const findUserProfileByAsaasSubscriptionId = async (asaasSubscriptionId: string): Promise<AppUser | null> => {
  const snapshot = await getFirestoreDb()
    .collection(COLLECTIONS.users)
    .where('asaasSubscriptionId', '==', asaasSubscriptionId)
    .limit(1)
    .get();
  const [user] = fromQuery<AppUser>(snapshot);
  return user ?? null;
};

export const findEmployeeByEmail = async (email: string): Promise<Employee | null> => {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const snapshot = await getFirestoreDb()
      .collection(COLLECTIONS.employees)
      .where('email', '==', normalizedEmail)
      .where('active', '==', true)
      .limit(1)
      .get();
    const [employee] = fromQuery<Employee>(snapshot);
    return employee ?? null;
  } catch (error) {
    console.error('EMPLOYEE_LOOKUP_FAILED', error);
    return null;
  }
};

export const upsertUserProfile = async (params: {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: boolean;
}) => {
  const ref = getFirestoreDb().collection(COLLECTIONS.users).doc(params.id);
  const existing = fromDoc<AppUser>(await ref.get());
  const now = new Date();
  const normalizedEmail = params.email.trim().toLowerCase();
  const employee = await findEmployeeByEmail(normalizedEmail);
  const access = resolvePrivilegedAccess(normalizedEmail, {
    role: existing?.role ?? (employee?.role ?? null),
    bypassSubscription: existing?.bypassSubscription,
  });

  const userProfile: AppUser = {
    id: params.id,
    name: params.name ?? existing?.name ?? employee?.name ?? normalizedEmail.split('@')[0],
    email: normalizedEmail,
    emailVerified: params.emailVerified ?? existing?.emailVerified ?? false,
    image: params.image ?? existing?.image ?? null,
    role: access.role === 'owner' && employee?.role ? employee.role : access.role,
    bypassSubscription: access.bypassSubscription,
    stripeCustomerId: existing?.stripeCustomerId ?? null,
    stripeSubscriptionId: existing?.stripeSubscriptionId ?? null,
    asaasCustomerId: existing?.asaasCustomerId ?? null,
    asaasSubscriptionId: existing?.asaasSubscriptionId ?? null,
    asaasCheckoutId: existing?.asaasCheckoutId ?? null,
    subscriptionStatus: existing?.subscriptionStatus ?? null,
    plan: existing?.plan ?? null,
    clinicId: existing?.clinicId ?? employee?.clinicId ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await ref.set(sanitizeFirestoreValue(userProfile) as DocumentData);
  invalidateUserScopedCache(params.id);
  invalidateClinicScopedCache(userProfile.clinicId);
  return userProfile;
};

export const updateUserSubscription = async (
  userId: string,
  params: { stripeCustomerId: string | null; stripeSubscriptionId: string | null; plan: string | null },
) => {
  const ref = getFirestoreDb().collection(COLLECTIONS.users).doc(userId);
  const existing = fromDoc<AppUser>(await ref.get());
  if (!existing) throw new Error('User not found');

  const userProfile: AppUser = {
    ...existing,
    stripeCustomerId: params.stripeCustomerId,
    stripeSubscriptionId: params.stripeSubscriptionId,
    plan: params.plan,
    updatedAt: new Date(),
  };

  await ref.set(sanitizeFirestoreValue(userProfile) as DocumentData);
  if (userProfile.clinicId) {
    await updateClinicSubscription(userProfile.clinicId, params);
  }
  invalidateUserScopedCache(userId);
  invalidateClinicScopedCache(userProfile.clinicId);
  return userProfile;
};

export const getClinicById = async (clinicId: string): Promise<Clinic | null> => {
  return withServerCache(`clinic:${clinicId}`, 60_000, async () => {
    const snapshot = await getFirestoreDb().collection(COLLECTIONS.clinics).doc(clinicId).get();
    return fromDoc<Clinic>(snapshot);
  });
};

export const createClinicForUser = async (params: { userId: string; name: string }) => {
  const user = await getUserProfileById(params.userId);
  if (!user) throw new Error('User not found');

  const clinicId = randomUUID();
  const now = new Date();
  const clinic: Clinic = {
    id: clinicId,
    name: params.name,
    cnpj: null,
    address: null,
    phoneNumber: null,
    logoUrl: null,
    cloudinaryPublicId: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    asaasCustomerId: null,
    asaasSubscriptionId: null,
    asaasCheckoutId: null,
    subscriptionStatus: null,
    plan: null,
    createdAt: now,
    updatedAt: now,
  };

  const updatedUser: AppUser = { ...user, clinicId, updatedAt: now };
  const batch = getFirestoreDb().batch();
  batch.set(getFirestoreDb().collection(COLLECTIONS.clinics).doc(clinicId), sanitizeFirestoreValue(clinic) as DocumentData);
  batch.set(getFirestoreDb().collection(COLLECTIONS.users).doc(params.userId), sanitizeFirestoreValue(updatedUser) as DocumentData);
  await batch.commit();
  invalidateUserScopedCache(params.userId);
  invalidateClinicScopedCache(clinicId);
  return clinic;
};

export const updateClinicSettings = async (clinicId: string, params: Partial<Omit<Clinic, 'id' | 'createdAt' | 'updatedAt'>>) => {
  const ref = getFirestoreDb().collection(COLLECTIONS.clinics).doc(clinicId);
  const existing = fromDoc<Clinic>(await ref.get());
  if (!existing) throw new Error('Clinic not found');

  const clinic: Clinic = {
    ...existing,
    ...params,
    id: clinicId,
    updatedAt: new Date(),
  };
  await ref.set(sanitizeFirestoreValue(clinic) as DocumentData);
  invalidateClinicScopedCache(clinicId);
  return clinic;
};


export const updateClinicSubscription = async (
  clinicId: string,
  params: { stripeCustomerId: string | null; stripeSubscriptionId: string | null; plan: string | null },
) => {
  const ref = getFirestoreDb().collection(COLLECTIONS.clinics).doc(clinicId);
  const existing = fromDoc<Clinic>(await ref.get());
  if (!existing) throw new Error('Clinic not found');

  const clinic: Clinic = {
    ...existing,
    stripeCustomerId: params.stripeCustomerId,
    stripeSubscriptionId: params.stripeSubscriptionId,
    plan: params.plan,
    updatedAt: new Date(),
  };

  await ref.set(sanitizeFirestoreValue(clinic) as DocumentData);
  invalidateClinicScopedCache(clinicId);
  return clinic;
};

export const updateUserAsaasSubscription = async (
  userId: string,
  params: {
    asaasCustomerId?: string | null;
    asaasSubscriptionId?: string | null;
    asaasCheckoutId?: string | null;
    subscriptionStatus?: string | null;
    plan?: string | null;
  },
) => {
  const ref = getFirestoreDb().collection(COLLECTIONS.users).doc(userId);
  const existing = fromDoc<AppUser>(await ref.get());
  if (!existing) throw new Error('User not found');

  const userProfile: AppUser = {
    ...existing,
    asaasCustomerId: params.asaasCustomerId === undefined ? existing.asaasCustomerId : params.asaasCustomerId,
    asaasSubscriptionId:
      params.asaasSubscriptionId === undefined ? existing.asaasSubscriptionId : params.asaasSubscriptionId,
    asaasCheckoutId: params.asaasCheckoutId === undefined ? existing.asaasCheckoutId : params.asaasCheckoutId,
    subscriptionStatus: params.subscriptionStatus === undefined ? existing.subscriptionStatus : params.subscriptionStatus,
    plan: params.plan === undefined ? existing.plan : params.plan,
    updatedAt: new Date(),
  };

  await ref.set(sanitizeFirestoreValue(userProfile) as DocumentData);

  if (userProfile.clinicId) {
    const clinicRef = getFirestoreDb().collection(COLLECTIONS.clinics).doc(userProfile.clinicId);
    const existingClinic = fromDoc<Clinic>(await clinicRef.get());

    if (existingClinic) {
      const clinic: Clinic = {
        ...existingClinic,
        asaasCustomerId:
          params.asaasCustomerId === undefined ? existingClinic.asaasCustomerId : params.asaasCustomerId,
        asaasSubscriptionId:
          params.asaasSubscriptionId === undefined ? existingClinic.asaasSubscriptionId : params.asaasSubscriptionId,
        subscriptionStatus:
          params.subscriptionStatus === undefined ? existingClinic.subscriptionStatus : params.subscriptionStatus,
        plan: params.plan === undefined ? existingClinic.plan : params.plan,
        updatedAt: new Date(),
      };

      await clinicRef.set(sanitizeFirestoreValue(clinic) as DocumentData);
      invalidateClinicScopedCache(userProfile.clinicId);
    }
  }

  invalidateUserScopedCache(userId);
  invalidateClinicScopedCache(userProfile.clinicId);
  return userProfile;
};

export const listDoctorsByClinicId = async (clinicId: string): Promise<Doctor[]> => {
  return withServerCache(`clinic:${clinicId}:doctors`, 120_000, async () => {
    const snapshot = await getFirestoreDb().collection(COLLECTIONS.doctors).where('clinicId', '==', clinicId).get();
    return sortByName(fromQuery<Doctor>(snapshot));
  });
};

export const getDoctorById = async (doctorId: string): Promise<Doctor | null> => {
  const snapshot = await getFirestoreDb().collection(COLLECTIONS.doctors).doc(doctorId).get();
  return fromDoc<Doctor>(snapshot);
};

export const listSpecialtiesByClinicId = async (clinicId: string): Promise<Specialty[]> => {
  return withServerCache(`clinic:${clinicId}:specialties`, 120_000, async () => {
    const snapshot = await getFirestoreDb().collection(COLLECTIONS.specialties).where('clinicId', '==', clinicId).get();
    return sortByName(fromQuery<Specialty>(snapshot));
  });
};

export const searchSpecialtiesByClinicId = async (clinicId: string, query: string): Promise<Specialty[]> => {
  const allSpecialties = await listSpecialtiesByClinicId(clinicId);
  const normalized = normalizeSearchText(query);
  if (!normalized) return allSpecialties;
  return allSpecialties.filter((specialty) => normalizeSearchText(specialty.name).includes(normalized));
};

export const upsertSpecialtyRecord = async (params: { id?: string; clinicId: string; name: string }) => {
  const specialtyId = params.id ?? randomUUID();
  const ref = getFirestoreDb().collection(COLLECTIONS.specialties).doc(specialtyId);
  const existing = fromDoc<Specialty>(await ref.get());
  const now = new Date();
  const specialty: Specialty = {
    id: specialtyId,
    clinicId: params.clinicId,
    name: params.name.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await ref.set(sanitizeFirestoreValue(specialty) as DocumentData);
  invalidateClinicScopedCache(params.clinicId);
  return specialty;
};

export const deleteSpecialtyRecord = async (specialtyId: string) => {
  const snapshot = await getFirestoreDb().collection(COLLECTIONS.specialties).doc(specialtyId).get();
  const specialty = fromDoc<Specialty>(snapshot);
  await getFirestoreDb().collection(COLLECTIONS.specialties).doc(specialtyId).delete();
  invalidateClinicScopedCache(specialty?.clinicId ?? null);
};

export const upsertDoctorRecord = async (params: {
  id?: string;
  clinicId: string;
  name: string;
  specialty: string;
  crm: string;
  sex?: Doctor['sex'];
  appointmentPriceInCents: number;
  availableFromWeekDay?: number | null;
  availableToWeekDay?: number | null;
  availableFromTime?: string | null;
  availableToTime?: string | null;
  availabilityRanges?: Doctor['availabilityRanges'];
  avatarImageUrl?: string | null;
}) => {
  const doctorId = params.id ?? randomUUID();
  const ref = getFirestoreDb().collection(COLLECTIONS.doctors).doc(doctorId);
  const existing = fromDoc<Doctor>(await ref.get());
  const now = new Date();

  const doctor: Doctor = {
    id: doctorId,
    clinicId: params.clinicId,
    name: params.name,
    avatarImageUrl: params.avatarImageUrl ?? existing?.avatarImageUrl ?? null,
    sex: params.sex ?? existing?.sex ?? 'male',
    crm: params.crm,
    specialty: params.specialty,
    appointmentPriceInCents: params.appointmentPriceInCents,
    availableFromWeekDay: params.availableFromWeekDay ?? existing?.availableFromWeekDay ?? null,
    availableToWeekDay: params.availableToWeekDay ?? existing?.availableToWeekDay ?? null,
    availableFromTime: params.availableFromTime ?? existing?.availableFromTime ?? null,
    availableToTime: params.availableToTime ?? existing?.availableToTime ?? null,
    availabilityRanges: params.availabilityRanges ?? existing?.availabilityRanges ?? [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await ref.set(sanitizeFirestoreValue(doctor) as DocumentData);
  invalidateClinicScopedCache(params.clinicId);
  invalidateDoctorScopedCache(doctorId);
  return doctor;
};

export const deleteDoctorRecord = async (doctorId: string) => {
  const [doctorSnapshot, appointmentsSnapshot] = await Promise.all([
    getFirestoreDb().collection(COLLECTIONS.doctors).doc(doctorId).get(),
    getFirestoreDb().collection(COLLECTIONS.appointments).where('doctorId', '==', doctorId).get(),
  ]);
  if (!doctorSnapshot.exists) return;
  await deleteDocsInChunks(appointmentsSnapshot.docs);
  await doctorSnapshot.ref.delete();
  const existingDoctor = fromDoc<Doctor>(doctorSnapshot);
  invalidateClinicScopedCache(existingDoctor?.clinicId ?? null);
  invalidateDoctorScopedCache(doctorId);
};

export const listPatientsByClinicId = async (clinicId: string): Promise<Patient[]> => {
  return withServerCache(`clinic:${clinicId}:patients`, 120_000, async () => {
    const snapshot = await getFirestoreDb().collection(COLLECTIONS.patients).where('clinicId', '==', clinicId).get();
    return sortByName(fromQuery<Patient>(snapshot));
  });
};

export const listRecentPatientsByClinicId = async (clinicId: string, limit = 20): Promise<Patient[]> => {
  const patients = await listPatientsByClinicId(clinicId);
  return sortByCreatedAtDesc(patients).slice(0, limit);
};

export const searchPatientsByClinicId = async (clinicId: string, query: string): Promise<Patient[]> => {
  const allPatients = await listPatientsByClinicId(clinicId);
  const normalized = normalizeSearchText(query);
  if (!normalized) return allPatients;
  return allPatients.filter((patient) => normalizeSearchText(patient.name).includes(normalized));
};

export const getPatientById = async (patientId: string): Promise<Patient | null> => {
  const snapshot = await getFirestoreDb().collection(COLLECTIONS.patients).doc(patientId).get();
  return fromDoc<Patient>(snapshot);
};

export const upsertPatientRecord = async (params: {
  id?: string;
  clinicId: string;
  name: string;
  email: string;
  phoneNumber: string;
  address?: string | null;
  sex: Patient['sex'];
}) => {
  const patientId = params.id ?? randomUUID();
  const ref = getFirestoreDb().collection(COLLECTIONS.patients).doc(patientId);
  const existing = fromDoc<Patient>(await ref.get());
  const now = new Date();

  const patient: Patient = {
    id: patientId,
    clinicId: params.clinicId,
    name: params.name,
    email: params.email,
    phoneNumber: params.phoneNumber,
    address: params.address ?? existing?.address ?? null,
    sex: params.sex,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await ref.set(sanitizeFirestoreValue(patient) as DocumentData);
  invalidateClinicScopedCache(params.clinicId);
  return patient;
};

export const deletePatientRecord = async (patientId: string) => {
  const [patientSnapshot, appointmentsSnapshot] = await Promise.all([
    getFirestoreDb().collection(COLLECTIONS.patients).doc(patientId).get(),
    getFirestoreDb().collection(COLLECTIONS.appointments).where('patientId', '==', patientId).get(),
  ]);
  if (!patientSnapshot.exists) return;
  await deleteDocsInChunks(appointmentsSnapshot.docs);
  await patientSnapshot.ref.delete();
  const existingPatient = fromDoc<Patient>(patientSnapshot);
  invalidateClinicScopedCache(existingPatient?.clinicId ?? null);
};

export const listAppointmentsByClinicId = async (clinicId: string): Promise<Appointment[]> => {
  return withServerCache(`clinic:${clinicId}:appointments`, 90_000, async () => {
    const snapshot = await getFirestoreDb().collection(COLLECTIONS.appointments).where('clinicId', '==', clinicId).get();
    return sortByDateDesc(fromQuery<Appointment>(snapshot));
  });
};

export const listAppointmentsByDoctorId = async (doctorId: string): Promise<Appointment[]> => {
  return withServerCache(`doctor:${doctorId}:appointments`, 90_000, async () => {
    const snapshot = await getFirestoreDb().collection(COLLECTIONS.appointments).where('doctorId', '==', doctorId).get();
    return sortByDateDesc(fromQuery<Appointment>(snapshot));
  });
};

export const getAppointmentById = async (appointmentId: string): Promise<Appointment | null> => {
  const snapshot = await getFirestoreDb().collection(COLLECTIONS.appointments).doc(appointmentId).get();
  return fromDoc<Appointment>(snapshot);
};

export const createAppointmentRecord = async (params: {
  clinicId: string;
  patientId: string;
  doctorId: string;
  date: Date;
  appointmentPriceInCents: number;
  notes?: string | null;
  status?: Appointment['status'];
  cancelledAt?: Date | null;
  cancelledByUserId?: string | null;
  createdByUserId?: string | null;
  paymentConfirmed?: boolean;
  paymentMethod?: Appointment['paymentMethod'];
  paymentDate?: Date | null;
  paymentConfirmedByUserId?: string | null;
}) => {
  const appointmentId = randomUUID();
  const now = new Date();
  const appointment: Appointment = {
    id: appointmentId,
    clinicId: params.clinicId,
    patientId: params.patientId,
    doctorId: params.doctorId,
    date: params.date,
    appointmentPriceInCents: params.appointmentPriceInCents,
    notes: params.notes ?? null,
    status: params.status ?? 'scheduled',
    cancelledAt: params.cancelledAt ?? null,
    cancelledByUserId: params.cancelledByUserId ?? null,
    createdByUserId: params.createdByUserId ?? null,
    paymentConfirmed: params.paymentConfirmed ?? false,
    paymentMethod: params.paymentMethod ?? null,
    paymentDate: params.paymentDate ?? null,
    paymentConfirmedByUserId: params.paymentConfirmedByUserId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await getFirestoreDb().collection(COLLECTIONS.appointments).doc(appointmentId).set(sanitizeFirestoreValue(appointment) as DocumentData);
  invalidateClinicScopedCache(params.clinicId);
  invalidateDoctorScopedCache(params.doctorId);
  return appointment;
};

export const updateAppointmentRecord = async (params: {
  id: string;
  patientId: string;
  doctorId: string;
  date: Date;
  appointmentPriceInCents: number;
  notes?: string | null;
  status?: Appointment['status'];
  cancelledAt?: Date | null;
  cancelledByUserId?: string | null;
  createdByUserId?: string | null;
  paymentConfirmed?: boolean;
  paymentMethod?: Appointment['paymentMethod'];
  paymentDate?: Date | null;
  paymentConfirmedByUserId?: string | null;
}) => {
  const ref = getFirestoreDb().collection(COLLECTIONS.appointments).doc(params.id);
  const existing = fromDoc<Appointment>(await ref.get());
  if (!existing) throw new Error('Appointment not found');

  const appointment: Appointment = {
    ...existing,
    patientId: params.patientId,
    doctorId: params.doctorId,
    date: params.date,
    appointmentPriceInCents: params.appointmentPriceInCents,
    notes: params.notes ?? existing.notes ?? null,
    status: params.status ?? existing.status ?? 'scheduled',
    cancelledAt: params.cancelledAt === undefined ? (existing.cancelledAt ?? null) : params.cancelledAt,
    cancelledByUserId: params.cancelledByUserId === undefined ? (existing.cancelledByUserId ?? null) : params.cancelledByUserId,
    createdByUserId: params.createdByUserId ?? existing.createdByUserId ?? null,
    paymentConfirmed: params.paymentConfirmed ?? existing.paymentConfirmed,
    paymentMethod: params.paymentMethod ?? existing.paymentMethod,
    paymentDate: params.paymentDate ?? existing.paymentDate,
    paymentConfirmedByUserId: params.paymentConfirmedByUserId ?? existing.paymentConfirmedByUserId,
    updatedAt: new Date(),
  };
  await ref.set(sanitizeFirestoreValue(appointment) as DocumentData);
  invalidateClinicScopedCache(existing.clinicId);
  if (existing.doctorId !== params.doctorId) invalidateDoctorScopedCache(existing.doctorId);
  invalidateDoctorScopedCache(params.doctorId);
  return appointment;
};

export const confirmAppointmentPayment = async (params: {
  appointmentId: string;
  confirmedByUserId: string;
  paymentDate?: Date;
  paymentMethod?: Appointment['paymentMethod'];
}) => {
  const appointment = await getAppointmentById(params.appointmentId);
  if (!appointment) throw new Error('Appointment not found');
  return updateAppointmentRecord({
    id: appointment.id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    date: appointment.date,
    appointmentPriceInCents: appointment.appointmentPriceInCents,
    notes: appointment.notes,
    status: appointment.status ?? 'scheduled',
    cancelledAt: appointment.cancelledAt ?? null,
    cancelledByUserId: appointment.cancelledByUserId ?? null,
    createdByUserId: appointment.createdByUserId ?? null,
    paymentConfirmed: true,
    paymentDate: params.paymentDate ?? new Date(),
    paymentMethod: params.paymentMethod ?? appointment.paymentMethod ?? 'pix',
    paymentConfirmedByUserId: params.confirmedByUserId,
  });
};

export const setAppointmentStatus = async (params: {
  appointmentId: string;
  status: Appointment['status'];
  userId: string;
}) => {
  const appointment = await getAppointmentById(params.appointmentId);
  if (!appointment) throw new Error('Appointment not found');

  const isCancelling = params.status === 'cancelled';
  return updateAppointmentRecord({
    id: appointment.id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    date: appointment.date,
    appointmentPriceInCents: appointment.appointmentPriceInCents,
    notes: appointment.notes,
    status: params.status,
    cancelledAt: isCancelling ? new Date() : null,
    cancelledByUserId: isCancelling ? params.userId : null,
    createdByUserId: appointment.createdByUserId ?? null,
    paymentConfirmed: appointment.paymentConfirmed,
    paymentDate: appointment.paymentDate,
    paymentMethod: appointment.paymentMethod,
    paymentConfirmedByUserId: appointment.paymentConfirmedByUserId,
  });
};

export const deleteAppointmentRecord = async (appointmentId: string) => {
  const existing = await getAppointmentById(appointmentId);
  await getFirestoreDb().collection(COLLECTIONS.appointments).doc(appointmentId).delete();
  invalidateClinicScopedCache(existing?.clinicId ?? null);
  invalidateDoctorScopedCache(existing?.doctorId ?? null);
};

export const listAppointmentsByClinicIdWithRelations = async (clinicId: string): Promise<AppointmentWithRelations[]> => {
  return withServerCache(`clinic:${clinicId}:appointments:relations`, 90_000, async () => {
    const appointments = await listAppointmentsByClinicId(clinicId);
    const [patientsById, doctorsById] = await Promise.all([
      getEntitiesByIds<Patient>(COLLECTIONS.patients, appointments.map((appointment) => appointment.patientId)),
      getEntitiesByIds<Doctor>(COLLECTIONS.doctors, appointments.map((appointment) => appointment.doctorId)),
    ]);

    return appointments
      .map((appointment) => {
        const patient = patientsById[appointment.patientId];
        const doctor = doctorsById[appointment.doctorId];
        if (!patient || !doctor) return null;
        return { ...appointment, patient, doctor };
      })
      .filter((appointment): appointment is AppointmentWithRelations => Boolean(appointment));
  });
};


export const getAppointmentByIdWithRelations = async (appointmentId: string): Promise<AppointmentWithRelations | null> => {
  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) return null;
  const [patient, doctor] = await Promise.all([
    getPatientById(appointment.patientId),
    getDoctorById(appointment.doctorId),
  ]);
  if (!patient || !doctor) return null;
  return { ...appointment, patient, doctor };
};

export const listEmployeesByClinicId = async (clinicId: string): Promise<Employee[]> => {
  return withServerCache(`clinic:${clinicId}:employees`, 120_000, async () => {
    const snapshot = await getFirestoreDb().collection(COLLECTIONS.employees).where('clinicId', '==', clinicId).get();
    return sortByName(fromQuery<Employee>(snapshot));
  });
};

export const upsertEmployeeRecord = async (params: { id?: string; clinicId: string; name: string; email: string; role: Employee['role']; active?: boolean }) => {
  const employeeId = params.id ?? randomUUID();
  const ref = getFirestoreDb().collection(COLLECTIONS.employees).doc(employeeId);
  const existing = fromDoc<Employee>(await ref.get());
  const now = new Date();
  const normalizedEmail = params.email.trim().toLowerCase();

  const duplicateSnapshot = await getFirestoreDb()
    .collection(COLLECTIONS.employees)
    .where('email', '==', normalizedEmail)
    .where('active', '==', true)
    .get();

  const duplicate = fromQuery<Employee>(duplicateSnapshot).find(
    (employee) => employee.id !== employeeId && employee.clinicId !== params.clinicId,
  );

  if (duplicate) {
    throw new Error('EMPLOYEE_EMAIL_ALREADY_LINKED_TO_ANOTHER_CLINIC');
  }

  const employee: Employee = {
    id: employeeId,
    clinicId: params.clinicId,
    name: params.name,
    email: normalizedEmail,
    role: params.role,
    active: params.active ?? existing?.active ?? true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await ref.set(sanitizeFirestoreValue(employee) as DocumentData);
  invalidateClinicScopedCache(params.clinicId);

  const usersSnapshot = await getFirestoreDb().collection(COLLECTIONS.users).where('email', '==', normalizedEmail).limit(1).get();
  const existingUser = fromQuery<AppUser>(usersSnapshot)[0];
  if (existingUser) {
    await getFirestoreDb().collection(COLLECTIONS.users).doc(existingUser.id).set(
      sanitizeFirestoreValue({
        ...existingUser,
        name: params.name || existingUser.name,
        clinicId: params.clinicId,
        role: params.role,
        updatedAt: now,
      }) as DocumentData,
    );
  }

  invalidateServerCache();
  return employee;
};

export const getDashboardData = async (params: { clinicId: string; from: string; to: string }) => {
  const [doctors, patients, appointmentsWithRelations] = await Promise.all([
    listDoctorsByClinicId(params.clinicId),
    listPatientsByClinicId(params.clinicId),
    listAppointmentsByClinicIdWithRelations(params.clinicId),
  ]);

  const fromDate = dayjs(params.from).startOf('day').toDate();
  const toDate = dayjs(params.to).endOf('day').toDate();
  const chartStartDate = dayjs().subtract(10, 'days').startOf('day').toDate();
  const chartEndDate = dayjs().add(10, 'days').endOf('day').toDate();
  const todayStart = dayjs().startOf('day').toDate();
  const todayEnd = dayjs().endOf('day').toDate();

  const activeAppointments = appointmentsWithRelations.filter(isActiveAppointment);
  const appointmentsInRange = activeAppointments.filter((appointment) => inDateRange(appointment.date, fromDate, toDate));
  const chartAppointments = activeAppointments.filter((appointment) => inDateRange(appointment.date, chartStartDate, chartEndDate));
  const todayAppointments = activeAppointments.filter((appointment) => inDateRange(appointment.date, todayStart, todayEnd));
  const paidAppointmentsInRange = appointmentsInRange.filter((appointment) => appointment.paymentConfirmed && appointment.paymentDate && inDateRange(appointment.paymentDate, fromDate, toDate));
  const completedAppointmentsInRange = appointmentsInRange.filter((appointment) => appointment.status === 'completed');

  const doctorAppointmentCount = appointmentsInRange.reduce<Record<string, number>>((acc, appointment) => {
    acc[appointment.doctorId] = (acc[appointment.doctorId] ?? 0) + 1;
    return acc;
  }, {});

  const topDoctors = [...doctors]
    .map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      avatarImageUrl: doctor.avatarImageUrl,
      specialty: doctor.specialty,
      appointments: doctorAppointmentCount[doctor.id] ?? 0,
    }))
    .sort((left, right) => (right.appointments !== left.appointments ? right.appointments - left.appointments : left.name.localeCompare(right.name, 'pt-BR')))
    .slice(0, 10);

  const specialtyMap = appointmentsInRange.reduce<Record<string, number>>((acc, appointment) => {
    acc[appointment.doctor.specialty] = (acc[appointment.doctor.specialty] ?? 0) + 1;
    return acc;
  }, {});

  const topSpecialties = Object.entries(specialtyMap).map(([specialty, appointments]) => ({ specialty, appointments })).sort((l, r) => r.appointments - l.appointments);

  const dailyMap = chartAppointments.reduce<Record<string, { appointments: number; revenue: number }>>((acc, appointment) => {
    const key = dayjs(appointment.paymentConfirmed && appointment.paymentDate ? appointment.paymentDate : appointment.date).format('YYYY-MM-DD');
    acc[key] = acc[key] ?? { appointments: 0, revenue: 0 };
    acc[key].appointments += 1;
    if (appointment.paymentConfirmed) acc[key].revenue += appointment.appointmentPriceInCents;
    return acc;
  }, {});

  const dailyAppointmentsData = Object.entries(dailyMap)
    .map(([date, values]) => ({ date, appointments: values.appointments, revenue: values.revenue }))
    .sort((left, right) => left.date.localeCompare(right.date));

  const upcomingAppointments = activeAppointments
    .filter((appointment) => appointment.date.getTime() >= todayStart.getTime())
    .sort((left, right) => left.date.getTime() - right.date.getTime())
    .slice(0, 8);

  const totalRevenue = paidAppointmentsInRange.reduce((acc, appointment) => acc + appointment.appointmentPriceInCents, 0);
  const pendingRevenue = appointmentsInRange
    .filter((appointment) => !appointment.paymentConfirmed)
    .reduce((acc, appointment) => acc + appointment.appointmentPriceInCents, 0);
  const collectionRate = appointmentsInRange.length
    ? (appointmentsInRange.filter((appointment) => appointment.paymentConfirmed).length / appointmentsInRange.length) * 100
    : 0;

  return {
    totalRevenue: { total: totalRevenue },
    pendingRevenue: { total: pendingRevenue },
    collectionRate,
    totalAppointments: { total: appointmentsInRange.length },
    totalPatients: { total: patients.length },
    totalDoctors: { total: doctors.length },
    completedAppointments: { total: completedAppointmentsInRange.length },
    topDoctors,
    topSpecialties,
    todayAppointments: sortByDateDesc(todayAppointments),
    dailyAppointmentsData,
    upcomingAppointments,
  };
};
