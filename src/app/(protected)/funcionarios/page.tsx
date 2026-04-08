import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageActions, PageContainer, PageContent, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { canAccessUserManagement } from '@/lib/access';
import { requireSubscribedSession } from '@/lib/auth';
import { listEmployeesByClinicId } from '@/server/clinic-data';

import EmployeeForm from './_components/employee-form';

export default async function FuncionariosPage() {
  const session = await requireSubscribedSession();
  if (!canAccessUserManagement(session.user.role)) redirect('/agendamentos');
  const employees = await listEmployeesByClinicId(session.user.clinic!.id);
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Funcionários</PageTitle>
        </PageHeaderContent>
        <PageActions><EmployeeForm /></PageActions>
      </PageHeader>
      <PageContent>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => (
            <Card key={employee.id}><CardHeader><CardTitle className="text-base">{employee.name}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>{employee.email}</p><p>Perfil: {employee.role === 'admin' ? 'Admin' : 'Atendente'}</p><EmployeeForm employee={employee} /></CardContent></Card>
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
}
