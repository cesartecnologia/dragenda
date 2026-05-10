'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PatternFormat } from 'react-number-format';
import { toast } from 'sonner';
import { z } from 'zod';

import { upsertPatient } from '@/actions/upsert-patient';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { patientsTable } from '@/db/schema';

const formSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nome é obrigatório.' }),
  email: z.string().trim().refine((value) => value === '' || z.string().email().safeParse(value).success, { message: 'Email inválido.' }),
  phoneNumber: z.string().trim().refine((value) => value === '' || value.replace(/\D/g, '').length >= 10, { message: 'Informe um telefone válido.' }),
  address: z.string().trim().optional().nullable(),
  sex: z.enum(['male', 'female']),
});

interface UpsertPatientFormProps {
  patient?: typeof patientsTable.$inferSelect;
  onSuccess?: () => void;
  isOpen?: boolean;
}

const UpsertPatientForm = ({ patient, onSuccess, isOpen }: UpsertPatientFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: patient?.name ?? '',
      email: patient?.email ?? '',
      phoneNumber: patient?.phoneNumber ?? '',
      address: patient?.address ?? '',
      sex: patient?.sex ?? 'female',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: patient?.name ?? '',
        email: patient?.email ?? '',
        phoneNumber: patient?.phoneNumber ?? '',
        address: patient?.address ?? '',
        sex: patient?.sex ?? 'female',
      });
    }
  }, [form, patient, isOpen]);

  const upsertPatientAction = useAction(upsertPatient, {
    onSuccess: () => {
      toast.success(patient ? 'Paciente atualizado com sucesso.' : 'Paciente cadastrado com sucesso.');
      onSuccess?.();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Erro ao salvar paciente.'),
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    upsertPatientAction.execute({ ...values, id: patient?.id });
  };

  return (
    <DialogContent className="sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{patient ? 'Editar paciente' : 'Novo paciente'}</DialogTitle>
        <DialogDescription>Cadastre ou atualize os dados do paciente.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" placeholder="Opcional" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phoneNumber" render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <PatternFormat customInput={Input} format="(##) #####-####" value={field.value} placeholder="Opcional" onValueChange={(value) => field.onChange(value.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="sex" render={({ field }) => (
              <FormItem><FormLabel>Sexo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="female">Feminino</SelectItem><SelectItem value="male">Masculino</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
          </div>
          <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} value={field.value ?? ''} placeholder="Rua, número, bairro e cidade" /></FormControl><FormMessage /></FormItem>
          )} />
          <DialogFooter>
            <Button type="submit" disabled={upsertPatientAction.isExecuting}>{patient ? 'Salvar alterações' : 'Cadastrar paciente'}</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertPatientForm;
