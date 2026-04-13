import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageActions, PageContainer, PageContent, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { canAccessUserManagement } from '@/lib/access';
import { requireSubscribedSession } from '@/lib/auth';
import { listEmployeesByClinicId } from '@/server/clinic-data';

import EmployeeForm from './_components/employee-form';

const roleLabel: Record<'admin' | 'attendant' | 'user', string> = {
  admin: 'Administrador',
  attendant: 'Atendente',
  user: 'Usuário',
};

export default async function FuncionariosPage() {
  const session = await requireSubscribedSession();
  if (!canAccessUserManagement(session.user.role)) redirect('/agendamentos');
  const employees = await listEmployeesByClinicId(session.user.clinic!.id);
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Usuários</PageTitle>
        </PageHeaderContent>
        <PageActions><EmployeeForm /></PageActions>
      </PageHeader>
      <PageContent>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => (
            <Card key={employee.id} className="rounded-2xl">
              <CardHeader><CardTitle className="text-base">{employee.name}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="break-all text-muted-foreground">{employee.email}</p>
                <p>Perfil: {roleLabel[employee.role]}</p>
                <EmployeeForm employee={employee} />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
}
