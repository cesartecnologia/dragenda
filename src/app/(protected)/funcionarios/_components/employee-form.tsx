'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CopyIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { type ReactNode, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { upsertEmployee } from '@/actions/upsert-employee';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { employeesTable } from '@/db/schema';

const formSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'attendant']),
  createAccessNow: z.boolean().default(false),
  temporaryPassword: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.createAccessNow && (!value.temporaryPassword || value.temporaryPassword.length < 8)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['temporaryPassword'],
      message: 'Informe uma senha temporária com pelo menos 8 caracteres.',
    });
  }
});

const roleOptions = [
  {
    value: 'attendant',
    label: 'Atendente',
    description: 'Acessa a operação diária da clínica sem visualizar assinatura, painel, relatórios ou usuários.',
  },
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Gerencia a operação, usuários e configurações da clínica.',
  },
] as const;;

export default function EmployeeForm({
  employee,
  open,
  onOpenChange,
  hideDefaultTrigger = false,
  trigger,
}: {
  employee?: typeof employeesTable.$inferSelect;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideDefaultTrigger?: boolean;
  trigger?: ReactNode;
}) {
  type EmployeeFormInput = z.input<typeof formSchema>;
  type EmployeeFormOutput = z.output<typeof formSchema>;

  const [internalOpen, setInternalOpen] = useState(false);
  const [generatedAccess, setGeneratedAccess] = useState<{ email: string; password: string } | null>(null);

  const form = useForm<EmployeeFormInput, unknown, EmployeeFormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: employee?.name ?? '',
      email: employee?.email ?? '',
      role: employee?.role === 'admin' ? 'admin' : 'attendant',
      createAccessNow: false,
      temporaryPassword: '',
    },
  });

  const selectedRole = form.watch('role');
  const shouldProvisionAccess = form.watch('createAccessNow');
  const credentialsText = useMemo(() => {
    if (!generatedAccess) return '';
    return `Acesso ao sistema da clínica
Email: ${generatedAccess.email}
Senha temporária: ${generatedAccess.password}
Entrada: /login
No primeiro login o sistema solicitará a criação da senha definitiva`;
  }, [generatedAccess]);

  const dialogOpen = open ?? internalOpen;
  const setDialogOpen = onOpenChange ?? setInternalOpen;

  const action = useAction(upsertEmployee, {
    onSuccess: ({ data }) => {
      toast.success('Usuário salvo com sucesso.');
      if (data?.createdAccess && data.temporaryPassword && data.loginEmail) {
        setGeneratedAccess({ email: data.loginEmail, password: data.temporaryPassword });
        toast.success('Acesso configurado com sucesso.');
        return;
      }
      setGeneratedAccess(null);
      setDialogOpen(false);
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Erro ao salvar usuário.'),
  });

  const handleCopy = async () => {
    if (!credentialsText) return;
    await navigator.clipboard.writeText(credentialsText);
    toast.success('Credenciais copiadas.');
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={(nextOpen) => {
      setDialogOpen(nextOpen);
      if (!nextOpen) setGeneratedAccess(null);
    }}>
      {!hideDefaultTrigger ? (
        <DialogTrigger asChild>{trigger ?? <Button>{employee ? 'Editar usuário' : 'Novo usuário'}</Button>}</DialogTrigger>
      ) : null}
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{employee ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
          <DialogDescription>Vincule o usuário à clínica e defina o nível de acesso ideal.</DialogDescription>
        </DialogHeader>

        {generatedAccess ? (
          <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div>
              <h4 className="font-medium">Acesso configurado</h4>
              <p className="text-sm text-muted-foreground">Compartilhe estes dados com o colaborador. No primeiro login, ele deverá definir a senha definitiva.</p>
            </div>
            <div className="space-y-1 text-sm">
              <p><strong>Email:</strong> {generatedAccess.email}</p>
              <p><strong>Senha temporária:</strong> {generatedAccess.password}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" onClick={handleCopy}><CopyIcon className="mr-2 h-4 w-4" />Copiar credenciais</Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Concluir</Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => action.execute({
              ...values,
              email: values.email.trim().toLowerCase(),
              id: employee?.id,
              active: true,
              temporaryPassword: values.temporaryPassword?.trim() || undefined,
            }))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>} />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {roleOptions.find((option) => option.value === selectedRole)?.description}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <label className="flex items-start gap-3 rounded-lg border p-3 text-sm leading-6">
                <input type="checkbox" checked={shouldProvisionAccess} onChange={(event) => form.setValue('createAccessNow', event.target.checked)} className="mt-1" />
                <span>Liberar acesso deste usuário agora</span>
              </label>
              {shouldProvisionAccess ? (
                <FormField control={form.control} name="temporaryPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha temporária</FormLabel>
                    <FormControl><Input {...field} type="text" placeholder="Ex.: Clinica@2026" /></FormControl>
                    <p className="text-xs text-muted-foreground">Defina uma senha temporária. No primeiro login, o sistema pedirá uma nova senha definitiva.</p>
                    <FormMessage />
                  </FormItem>
                )} />
              ) : null}
              <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
