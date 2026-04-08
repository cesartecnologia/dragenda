'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { upsertSpecialty } from '@/actions/upsert-specialty';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { specialtiesTable } from '@/db/schema';

const formSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nome da especialidade é obrigatório.' }),
});

export default function SpecialtyForm({ specialty, onSuccess }: { specialty?: typeof specialtiesTable.$inferSelect; onSuccess?: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: specialty?.name ?? '' },
  });

  useEffect(() => {
    form.reset({ name: specialty?.name ?? '' });
  }, [form, specialty]);

  const action = useAction(upsertSpecialty, {
    onSuccess: () => {
      toast.success(specialty ? 'Especialidade atualizada.' : 'Especialidade cadastrada.');
      onSuccess?.();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Erro ao salvar especialidade.'),
  });

  return (
    <DialogContent className="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>{specialty ? 'Editar especialidade' : 'Nova especialidade'}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => action.execute({ id: specialty?.id, name: values.name }))} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especialidade</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex.: Cardiologia" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={action.isExecuting}>{specialty ? 'Salvar alterações' : 'Cadastrar especialidade'}</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
