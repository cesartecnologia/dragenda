type TableShim<T> = {
  $inferSelect: T;
};

const defineTable = <T,>(): TableShim<T> => ({
  $inferSelect: {} as T,
});

export type UserRole = 'master' | 'support' | 'owner' | 'admin' | 'attendant';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  bypassSubscription: boolean;
  mustChangePassword: boolean;
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
  postalCode: string | null;
  province: string | null;
  phoneNumber: string | null;
  logoUrl: string | null;
  cloudinaryPublicId: string | null;
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
  mustChangePassword: boolean;
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

export type CheckoutPaymentMethod = 'credit_card' | 'boleto';
export type CheckoutSessionStatus = 'initiated' | 'waiting_payment' | 'paid' | 'expired' | 'cancelled';

export interface CheckoutSessionRecord {
  id: string;
  planId: string;
  planName: string;
  value: number;
  paymentMethod: CheckoutPaymentMethod;
  status: CheckoutSessionStatus;
  asaasCheckoutId: string | null;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  paymentId: string | null;
  paymentStatus: string | null;
  checkoutUrl: string | null;
  invoiceUrl: string | null;
  payerName: string | null;
  payerEmail: string | null;
  payerPhone: string | null;
  payerCpfCnpj: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentRecordMethod = CheckoutPaymentMethod | null;

export interface PaymentRecord {
  id: string;
  sessionId: string | null;
  asaasPaymentId: string;
  status: string | null;
  method: PaymentRecordMethod;
  value: number | null;
  invoiceUrl: string | null;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type OnboardingStatus = 'locked' | 'released' | 'processing' | 'completed';

export interface OnboardingRecord {
  id: string;
  sessionId: string;
  status: OnboardingStatus;
  userId: string | null;
  clinicId: string | null;
  releasedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PendingSignupStatus =
  | 'checkout_created'
  | 'payment_pending'
  | 'checkout_paid'
  | 'checkout_cancelled'
  | 'checkout_expired'
  | 'registration_completed';

export type PendingSignupPaymentMethod = 'credit_card' | 'boleto';

export interface PendingSignupRecord {
  id: string;
  paymentMethod: PendingSignupPaymentMethod | null;
  checkoutId: string | null;
  invoiceUrl: string | null;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  paymentId: string | null;
  paymentStatus: string | null;
  status: PendingSignupStatus;
  payerName: string | null;
  payerEmail: string | null;
  payerPhone: string | null;
  payerCpfCnpj: string | null;
  clinicName: string | null;
  clinicCnpj: string | null;
  address: string | null;
  addressNumber: string | null;
  complement: string | null;
  postalCode: string | null;
  province: string | null;
  userId: string | null;
  clinicId: string | null;
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
export const checkoutSessionsTable = defineTable<CheckoutSessionRecord>();
export const paymentsTable = defineTable<PaymentRecord>();
export const onboardingTable = defineTable<OnboardingRecord>();
export const pendingSignupsTable = defineTable<PendingSignupRecord>();
