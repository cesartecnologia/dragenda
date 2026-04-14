'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CopyIcon, KeyRound } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { resetEmployeePassword } from '@/actions/reset-employee-password';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { employeesTable } from '@/db/schema';

const formSchema = z.object({
  temporaryPassword: z.string().min(8, 'Informe pelo menos 8 caracteres.'),
});

export function EmployeePasswordDialog({
  employee,
  open,
  onOpenChange,
}: {
  employee: typeof employeesTable.$inferSelect;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [generatedAccess, setGeneratedAccess] = useState<{ email: string; password: string } | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { temporaryPassword: '' },
  });

  const credentialsText = useMemo(() => {
    if (!generatedAccess) return '';
    return `Acesso ao sistema
Email: ${generatedAccess.email}
Senha temporária: ${generatedAccess.password}
Login: /login
No primeiro login o sistema solicitará a criação da senha definitiva`;
  }, [generatedAccess]);

  const action = useAction(resetEmployeePassword, {
    onSuccess: ({ data }) => {
      if (data?.email && data?.temporaryPassword) {
        setGeneratedAccess({ email: data.email, password: data.temporaryPassword });
        toast.success('Senha temporária atualizada com sucesso.');
      }
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Não foi possível alterar a senha.'),
  });

  const handleCopy = async () => {
    if (!credentialsText) return;
    await navigator.clipboard.writeText(credentialsText);
    toast.success('Credenciais copiadas.');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setGeneratedAccess(null);
          form.reset({ temporaryPassword: '' });
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Alterar senha do funcionário</DialogTitle>
          <DialogDescription>
            Defina uma nova senha temporária para {employee.name}. No próximo acesso ele deverá criar a senha definitiva.
          </DialogDescription>
        </DialogHeader>

        {generatedAccess ? (
          <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div>
              <h4 className="font-medium">Senha temporária atualizada</h4>
              <p className="text-sm text-muted-foreground">Compartilhe os dados abaixo com o colaborador.</p>
            </div>
            <div className="space-y-1 text-sm">
              <p><strong>Email:</strong> {generatedAccess.email}</p>
              <p><strong>Senha temporária:</strong> {generatedAccess.password}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" onClick={handleCopy}><CopyIcon className="mr-2 h-4 w-4" />Copiar credenciais</Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Concluir</Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => action.execute({ id: employee.id, temporaryPassword: values.temporaryPassword.trim() }))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="temporaryPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha temporária</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input className="pl-10" placeholder="Ex.: Clinica@2026" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Salvar nova senha</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
