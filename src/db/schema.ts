type TableShim<T> = {
  $inferSelect: T;
};

const defineTable = <T,>(): TableShim<T> => ({
  $inferSelect: {} as T,
});

export type UserRole = 'master' | 'support' | 'owner' | 'admin' | 'attendant' | 'user';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  bypassSubscription: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  asaasCheckoutId: string | null;
  subscriptionStatus: string | null;
  plan: string | null;
  clinicId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicRecord {
  id: string;
  name: string;
  cnpj: string | null;
  address: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  phoneNumber: string | null;
  logoUrl: string | null;
  cloudinaryPublicId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  asaasCheckoutId: string | null;
  subscriptionStatus: string | null;
  plan: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorAvailabilityRange {
  id: string;
  startDate: string;
  endDate: string;
  fromTime: string;
  toTime: string;
}

export type DoctorSex = 'male' | 'female';

export interface DoctorRecord {
  id: string;
  clinicId: string;
  name: string;
  avatarImageUrl: string | null;
  sex: DoctorSex | null;
  crm: string;
  specialty: string;
  appointmentPriceInCents: number;
  availableFromWeekDay: number | null;
  availableToWeekDay: number | null;
  availableFromTime: string | null;
  availableToTime: string | null;
  availabilityRanges: DoctorAvailabilityRange[];
  createdAt: Date;
  updatedAt: Date;
}

export type PatientSex = 'male' | 'female';

export interface PatientRecord {
  id: string;
  clinicId: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string | null;
  sex: PatientSex;
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentPaymentMethod = 'cash' | 'pix' | 'card' | 'insurance' | 'other';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface AppointmentRecord {
  id: string;
  date: Date;
  appointmentPriceInCents: number;
  clinicId: string;
  patientId: string;
  doctorId: string;
  notes: string | null;
  status: AppointmentStatus;
  cancelledAt: Date | null;
  cancelledByUserId: string | null;
  createdByUserId: string | null;
  paymentConfirmed: boolean;
  paymentMethod: AppointmentPaymentMethod | null;
  paymentDate: Date | null;
  paymentConfirmedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeRecord {
  id: string;
  clinicId: string;
  name: string;
  email: string;
  role: Extract<UserRole, 'admin' | 'attendant'>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpecialtyRecord {
  id: string;
  clinicId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserToClinicRecord {
  userId: string;
  clinicId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const usersTable = defineTable<UserRecord>();
export const clinicsTable = defineTable<ClinicRecord>();
export const doctorsTable = defineTable<DoctorRecord>();
export const patientsTable = defineTable<PatientRecord>();
export const appointmentsTable = defineTable<AppointmentRecord>();
export const employeesTable = defineTable<EmployeeRecord>();
export const specialtiesTable = defineTable<SpecialtyRecord>();
export const usersToClinicsTable = defineTable<UserToClinicRecord>();
