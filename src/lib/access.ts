import type { UserRole } from '@/db/schema';

type MinimalUser = {
  email?: string | null;
  role?: UserRole | string | null;
  bypassSubscription?: boolean | null;
};

const parseList = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const normalizeRole = (role?: UserRole | string | null): UserRole => {
  if (role === 'user') return 'attendant';
  if (role === 'attendant' || role === 'admin' || role === 'owner' || role === 'support' || role === 'master') {
    return role;
  }
  return 'owner';
};

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
  const normalizedExistingRole = normalizeRole(existing?.role);

  if (normalizedExistingRole === 'master' || normalizedExistingRole === 'support') {
    return { role: normalizedExistingRole, bypassSubscription: true };
  }

  if (existing?.bypassSubscription) {
    return { role: normalizedExistingRole, bypassSubscription: true };
  }

  return {
    role: normalizedExistingRole,
    bypassSubscription: Boolean(existing?.bypassSubscription),
  };
};

export const hasPrivilegedRole = (user?: MinimalUser | null) => {
  if (!user) return false;
  const access = resolvePrivilegedAccess(user.email, user);
  return access.bypassSubscription || access.role === 'master' || access.role === 'support';
};

const privilegedRoleList: UserRole[] = ['master', 'support', 'owner', 'admin'];
const operationalRoleList: UserRole[] = [...privilegedRoleList, 'attendant'];

const hasRole = (role: UserRole | string | null | undefined, allowed: UserRole[]) => allowed.includes(normalizeRole(role));

export const canAccessFinancial = (role?: UserRole | string | null) => hasRole(role, privilegedRoleList);
export const canAccessDashboard = (role?: UserRole | string | null) => hasRole(role, privilegedRoleList);
export const canAccessReports = (role?: UserRole | string | null) => hasRole(role, privilegedRoleList);
export const canAccessUserManagement = (role?: UserRole | string | null) => hasRole(role, privilegedRoleList);
export const canAccessClinicSettings = (role?: UserRole | string | null) => hasRole(role, privilegedRoleList);
export const canManageFinancialActions = (role?: UserRole | string | null) => hasRole(role, privilegedRoleList);
export const canManagePatients = (role?: UserRole | string | null) => hasRole(role, operationalRoleList);
export const canManageDoctors = (role?: UserRole | string | null) => hasRole(role, operationalRoleList);
export const canManageAppointments = (role?: UserRole | string | null) => hasRole(role, operationalRoleList);
export const canDeleteRecords = (role?: UserRole | string | null) => hasRole(role, privilegedRoleList);

export const isAdminRole = (role?: UserRole | string | null) => normalizeRole(role) === 'admin';
export const getDefaultPostLoginRoute = (role?: UserRole | string | null) => (canAccessDashboard(role) ? '/painel' : '/agendamentos');
