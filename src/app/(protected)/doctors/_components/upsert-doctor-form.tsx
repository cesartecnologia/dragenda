'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Plus, Search, Trash2 } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { toast } from 'sonner';
import { z } from 'zod';

import { upsertDoctor } from '@/actions/upsert-doctor';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { normalizeSearchText } from '@/helpers/format';
import { doctorsTable } from '@/db/schema';

import { medicalSpecialties } from '../_constants';

const rangeSchema = z.object({
  id: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  fromTime: z.string().min(1),
  toTime: z.string().min(1),
});

const formSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nome é obrigatório.' }),
  crm: z.string().trim().min(1, { message: 'CRM é obrigatório.' }),
  specialty: z.string().trim().min(1, { message: 'Especialidade é obrigatória.' }),
  appointmentPrice: z.number().min(1, { message: 'Preço da consulta é obrigatório.' }),
  availabilityRanges: z.array(rangeSchema).min(1, { message: 'Adicione ao menos um período.' }),
});

interface UpsertDoctorFormProps {
  doctor?: typeof doctorsTable.$inferSelect;
  specialties?: string[];
  onSuccess?: () => void;
}

const defaultRange = { startDate: '', endDate: '', fromTime: '08:00:00', toTime: '18:00:00' };

export default function UpsertDoctorForm({ doctor, specialties = [], onSuccess }: UpsertDoctorFormProps) {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: doctor?.name ?? '',
      crm: doctor?.crm ?? '',
      specialty: doctor?.specialty ?? '',
      appointmentPrice: doctor?.appointmentPriceInCents ? doctor.appointmentPriceInCents / 100 : 0,
      availabilityRanges: doctor?.availabilityRanges?.length ? doctor.availabilityRanges : [defaultRange],
    },
  });
  const ranges = useFieldArray({ control: form.control, name: 'availabilityRanges' });
  const [specialtySearch, setSpecialtySearch] = useState(doctor?.specialty ?? '');

  useEffect(() => {
    form.reset({
      name: doctor?.name ?? '',
      crm: doctor?.crm ?? '',
      specialty: doctor?.specialty ?? '',
      appointmentPrice: doctor?.appointmentPriceInCents ? doctor.appointmentPriceInCents / 100 : 0,
      availabilityRanges: doctor?.availabilityRanges?.length ? doctor.availabilityRanges : [defaultRange],
    });
    setSpecialtySearch(doctor?.specialty ?? '');
  }, [doctor, form]);

  const specialtyOptions = useMemo(() => {
    const merged = [
      ...specialties,
      ...medicalSpecialties.map((item) => item.label),
      doctor?.specialty ?? '',
    ]
      .map((item) => item.trim())
      .filter(Boolean);

    return [...new Set(merged)].sort((left, right) => left.localeCompare(right, 'pt-BR'));
  }, [doctor?.specialty, specialties]);

  const filteredSpecialties = useMemo(() => {
    const normalizedQuery = normalizeSearchText(specialtySearch);
    if (!normalizedQuery) return specialtyOptions.slice(0, 8);
    return specialtyOptions.filter((item) => normalizeSearchText(item).includes(normalizedQuery)).slice(0, 8);
  }, [specialtyOptions, specialtySearch]);

  const upsertDoctorAction = useAction(upsertDoctor, {
    onSuccess: () => {
      toast.success(doctor ? 'Médico atualizado com sucesso.' : 'Médico cadastrado com sucesso.');
      router.refresh();
      onSuccess?.();
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Erro ao salvar médico.'),
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    upsertDoctorAction.execute({
      id: doctor?.id,
      name: values.name,
      crm: values.crm,
      specialty: values.specialty,
      appointmentPriceInCents: Math.round(values.appointmentPrice * 100),
      availabilityRanges: values.availabilityRanges,
    });
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[760px]">
      <DialogHeader>
        <DialogTitle>{doctor ? 'Editar médico' : 'Novo médico'}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="crm" render={({ field }) => <FormItem><FormLabel>CRM</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Especialidade</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-md border px-3">
                        <Search className="size-4 text-muted-foreground" />
                        <Input
                          value={specialtySearch}
                          onChange={(event) => {
                            setSpecialtySearch(event.target.value);
                            field.onChange(event.target.value);
                          }}
                          className="border-0 shadow-none"
                          placeholder="Buscar ou digitar especialidade"
                        />
                      </div>
                      <div className="grid gap-2 rounded-md border p-2 sm:grid-cols-2">
                        {filteredSpecialties.length ? filteredSpecialties.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setSpecialtySearch(option);
                              field.onChange(option);
                            }}
                            className="flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted"
                          >
                            <span>{option}</span>
                            {field.value === option ? <Check className="size-4 text-primary" /> : null}
                          </button>
                        )) : <p className="col-span-full px-3 py-2 text-sm text-muted-foreground">Nenhuma sugestão encontrada. Você pode cadastrar uma nova especialidade.</p>}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="appointmentPrice" render={({ field }) => <FormItem><FormLabel>Preço da consulta</FormLabel><NumericFormat value={field.value} onValueChange={(v) => field.onChange(v.floatValue)} decimalScale={2} fixedDecimalScale decimalSeparator="," thousandSeparator="." prefix="R$ " customInput={Input} /><FormMessage /></FormItem>} />
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-medium">Períodos de atendimento</h3>
                <p className="text-sm text-muted-foreground">Defina somente as datas em que o médico atende nesta clínica.</p>
              </div>
              <Button type="button" variant="outline" onClick={() => ranges.append(defaultRange)}>
                <Plus className="mr-2 size-4" />Adicionar período
              </Button>
            </div>
            {ranges.fields.map((range, index) => (
              <div key={range.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-4">
                <FormField control={form.control} name={`availabilityRanges.${index}.startDate`} render={({ field }) => <FormItem><FormLabel>Data inicial</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name={`availabilityRanges.${index}.endDate`} render={({ field }) => <FormItem><FormLabel>Data final</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name={`availabilityRanges.${index}.fromTime`} render={({ field }) => <FormItem><FormLabel>Hora inicial</FormLabel><FormControl><Input type="time" step="1800" value={field.value?.slice(0, 5) ?? ''} onChange={(e) => field.onChange(`${e.target.value}:00`)} /></FormControl><FormMessage /></FormItem>} />
                <div className="flex items-end gap-2">
                  <FormField control={form.control} name={`availabilityRanges.${index}.toTime`} render={({ field }) => <FormItem className="flex-1"><FormLabel>Hora final</FormLabel><FormControl><Input type="time" step="1800" value={field.value?.slice(0, 5) ?? ''} onChange={(e) => field.onChange(`${e.target.value}:00`)} /></FormControl><FormMessage /></FormItem>} />
                  {ranges.fields.length > 1 ? <Button type="button" variant="ghost" size="icon" onClick={() => ranges.remove(index)}><Trash2 className="size-4" /></Button> : null}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={upsertDoctorAction.isExecuting}>{doctor ? 'Salvar alterações' : 'Cadastrar médico'}</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
