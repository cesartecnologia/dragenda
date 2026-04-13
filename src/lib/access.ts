import type { UserRole } from '@/db/schema';

type MinimalUser = {
  email?: string | null;
  role?: UserRole | null;
  bypassSubscription?: boolean | null;
};

const parseList = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

export const getPrivilegedEmails = () => {
  const masterEmails = [process.env.MASTER_EMAIL, ...parseList(process.env.MASTER_EMAILS)];
  const supportEmails = [process.env.SUPPORT_EMAIL, ...parseList(process.env.SUPPORT_EMAILS)];

  return {
    masterEmails: new Set(masterEmails.map((email) => email?.trim().toLowerCase()).filter(Boolean) as string[]),
    supportEmails: new Set(supportEmails.map((email) => email?.trim().toLowerCase()).filter(Boolean) as string[]),
  };
};

export const resolvePrivilegedAccess = (
  email?: string | null,
  existing?: Pick<MinimalUser, 'role' | 'bypassSubscription'> | null,
): { role: UserRole; bypassSubscription: boolean } => {
  const normalizedEmail = email?.trim().toLowerCase();
  const { masterEmails, supportEmails } = getPrivilegedEmails();

  if (normalizedEmail && supportEmails.has(normalizedEmail)) return { role: 'support', bypassSubscription: true };
  if (normalizedEmail && masterEmails.has(normalizedEmail)) return { role: 'master', bypassSubscription: true };
  if (existing?.role === 'master' || existing?.role === 'support') return { role: existing.role, bypassSubscription: true };
  if (existing?.bypassSubscription) return { role: (existing.role as UserRole | undefined) ?? 'owner', bypassSubscription: true };

  return {
    role: (existing?.role as UserRole | undefined) ?? 'owner',
    bypassSubscription: Boolean(existing?.bypassSubscription),
  };
};

export const hasPrivilegedRole = (user?: MinimalUser | null) => {
  if (!user) return false;
  const access = resolvePrivilegedAccess(user.email, user);
  return access.bypassSubscription || access.role === 'master' || access.role === 'support';
};

const privilegedRoleList: UserRole[] = ['master', 'support', 'owner', 'admin'];
const operationalRoleList: UserRole[] = [...privilegedRoleList, 'attendant', 'user'];

const hasRole = (role: UserRole | null | undefined, allowed: UserRole[]) => allowed.includes((role ?? 'owner') as UserRole);

export const canAccessFinancial = (role?: UserRole | null) => hasRole(role, privilegedRoleList);
export const canAccessDashboard = (role?: UserRole | null) => hasRole(role, privilegedRoleList);
export const canAccessReports = (role?: UserRole | null) => hasRole(role, privilegedRoleList);
export const canAccessUserManagement = (role?: UserRole | null) => hasRole(role, privilegedRoleList);
export const canAccessClinicSettings = (role?: UserRole | null) => hasRole(role, privilegedRoleList);
export const canManageFinancialActions = (role?: UserRole | null) => hasRole(role, privilegedRoleList);
export const canManagePatients = (role?: UserRole | null) => hasRole(role, operationalRoleList);
export const canManageDoctors = (role?: UserRole | null) => hasRole(role, operationalRoleList);
export const canManageAppointments = (role?: UserRole | null) => hasRole(role, operationalRoleList);
export const canDeleteRecords = (role?: UserRole | null) => hasRole(role, privilegedRoleList);

export const isAdminRole = (role?: UserRole | null) => role === 'admin';
export const getDefaultPostLoginRoute = (role?: UserRole | null) => (canAccessDashboard(role) ? '/painel' : '/agendamentos');
