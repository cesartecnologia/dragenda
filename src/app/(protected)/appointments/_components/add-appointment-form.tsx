'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon, Check, Clock3, CreditCard, Search, Stethoscope, X } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm, type DefaultValues } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { toast } from 'sonner';
import { z } from 'zod';

import { addAppointment } from '@/actions/add-appointment';
import { getAvailableTimes } from '@/actions/get-available-times';
import { Badge } from '@/components/ui/badge';
import { PaymentMethodPicker } from '@/components/payments/payment-method-picker';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { appointmentsTable, doctorsTable, patientsTable } from '@/db/schema';
import { formatCurrencyInCents } from '@/helpers/currency';
import { normalizeSearchText } from '@/helpers/format';
import { getBrazilDateKey, getBrazilTimeKey, getMinimumBookableTimeForDate, isPastDate, isSameBrazilDay, parseBrazilDate } from '@/helpers/time';
import { cn } from '@/lib/utils';

const formSchema = z
  .object({
    patientId: z.string().min(1, { message: 'Paciente é obrigatório.' }),
    doctorId: z.string().min(1, { message: 'Médico é obrigatório.' }),
    appointmentPrice: z.number().min(1, { message: 'Valor da consulta é obrigatório.' }),
    date: z.date().nullable().optional(),
    time: z.string().min(1, { message: 'Horário é obrigatório.' }),
    notes: z.string().optional(),
    paymentConfirmed: z.boolean().default(false),
    paymentMethod: z.enum(['cash', 'pix', 'card', 'insurance', 'other']).nullable().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data é obrigatória.',
        path: ['date'],
      });
    }
  });

interface AddAppointmentFormProps {
  isOpen: boolean;
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
  appointment?: ((typeof appointmentsTable.$inferSelect) & { patient: typeof patientsTable.$inferSelect; doctor: typeof doctorsTable.$inferSelect }) | null;
  onSuccess?: () => void;
  onClose?: () => void;
}

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;
type SearchableItem = { id: string; name: string };

const cardClass = 'rounded-xl border border-slate-200 bg-white p-5';
const titleClass = 'text-base font-semibold text-slate-900';
const fieldShellClass = 'flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10';
const inputClass = 'h-11 rounded-xl border-slate-200 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-primary/10';
const choiceButtonClass = 'h-10 rounded-xl border px-4 text-sm font-medium transition';

function isDateAllowedForDoctor(date: Date, doctor?: typeof doctorsTable.$inferSelect) {
  if (!doctor) return false;
  const selectedDate = parseBrazilDate(getBrazilDateKey(date)).startOf('day');

  if (doctor.availabilityRanges?.length) {
    return doctor.availabilityRanges.some((range) => {
      const start = parseBrazilDate(range.startDate).startOf('day');
      const end = parseBrazilDate(range.endDate).endOf('day');
      return selectedDate.isAfter(start.subtract(1, 'millisecond')) && selectedDate.isBefore(end.add(1, 'millisecond'));
    });
  }

  if (doctor.availableFromWeekDay !== null && doctor.availableToWeekDay !== null) {
    const weekday = selectedDate.day();
    return weekday >= doctor.availableFromWeekDay && weekday <= doctor.availableToWeekDay;
  }

  return true;
}

function splitAvailableTimeGroups(times: { value: string; label: string; available: boolean }[]) {
  const groups = {
    morning: [] as typeof times,
    afternoon: [] as typeof times,
    evening: [] as typeof times,
  };

  times.forEach((time) => {
    const hour = Number(time.value.slice(0, 2));
    if (hour < 12) groups.morning.push(time);
    else if (hour < 18) groups.afternoon.push(time);
    else groups.evening.push(time);
  });

  return [
    { label: 'Manhã', times: groups.morning },
    { label: 'Tarde', times: groups.afternoon },
    { label: 'Noite', times: groups.evening },
  ].filter((group) => group.times.length > 0);
}

function SearchSelect<T extends SearchableItem>(props: {
  value: string;
  onChange: (value: string) => void;
  items: T[];
  placeholder: string;
  searchPlaceholder: string;
  extraLabel?: (item: T) => string | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedItem = props.items.find((item) => item.id === props.value);

  useEffect(() => {
    if (!open) {
      const nextValue = selectedItem
        ? `${selectedItem.name}${props.extraLabel?.(selectedItem) ? ` • ${props.extraLabel(selectedItem)}` : ''}`
        : '';
      setSearch((current) => (current === nextValue ? current : nextValue));
    }
  }, [open, selectedItem, props.extraLabel]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const normalizedSearch = normalizeSearchText(search);
  const filteredItems = useMemo(() => {
    if (!normalizedSearch) return [];
    return props.items.filter((item) => normalizeSearchText(`${item.name} ${props.extraLabel?.(item) ?? ''}`).includes(normalizedSearch));
  }, [normalizedSearch, props.items, props.extraLabel]);

  const shouldShowResults = open && normalizedSearch.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className={fieldShellClass}>
        <Search className="size-4 text-slate-400" />
        <Input
          value={search}
          onFocus={() => {
            setOpen(true);
            setSearch('');
          }}
          onChange={(event) => {
            setOpen(true);
            setSearch(event.target.value);
          }}
          className="h-auto border-0 bg-transparent p-0 text-[15px] shadow-none focus-visible:ring-0"
          placeholder={selectedItem ? props.searchPlaceholder : props.placeholder}
        />
      </div>

      {shouldShowResults ? (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-950/8">
          {filteredItems.length ? (
            filteredItems.map((item) => {
              const extra = props.extraLabel?.(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    props.onChange(item.id);
                    setSearch(`${item.name}${extra ? ` • ${extra}` : ''}`);
                    setOpen(false);
                  }}
                  className="flex w-full items-start justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-primary/5"
                >
                  <div className="space-y-0.5">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    {extra ? <div className="text-xs text-muted-foreground">{extra}</div> : null}
                  </div>
                  {props.value === item.id ? <Check className="mt-0.5 size-4 text-primary" /> : null}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-5 text-center text-sm text-muted-foreground">Nenhum resultado encontrado.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function getDateInputValue(date?: Date | null) {
  return date ? getBrazilDateKey(date) : '';
}

export default function AddAppointmentForm({ patients, doctors, appointment, onSuccess, onClose, isOpen }: AddAppointmentFormProps) {
  const [mounted, setMounted] = useState(false);

  const defaultValues = useMemo<DefaultValues<FormInput>>(
    () => ({
      patientId: appointment?.patientId ?? '',
      doctorId: appointment?.doctorId ?? '',
      appointmentPrice: appointment?.appointmentPriceInCents ? appointment.appointmentPriceInCents / 100 : 0,
      date: appointment?.date ? new Date(appointment.date) : null,
      time: appointment?.date ? getBrazilTimeKey(appointment.date).slice(0, 5) : '',
      notes: appointment?.notes ?? '',
      paymentConfirmed: appointment?.paymentConfirmed ?? false,
      paymentMethod: appointment?.paymentMethod ?? 'pix',
    }),
    [appointment],
  );

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    form.reset(defaultValues);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [defaultValues, form, isOpen, onClose]);

  const selectedDoctorId = form.watch('doctorId');
  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  const paymentConfirmed = form.watch('paymentConfirmed');

  const selectedDoctor = useMemo(() => doctors.find((doctor) => doctor.id === selectedDoctorId), [doctors, selectedDoctorId]);
  const selectedDateKey = selectedDate ? getBrazilDateKey(selectedDate) : '';
  const minimumBookableTime = useMemo(() => (selectedDate ? getMinimumBookableTimeForDate(selectedDate) : null), [selectedDate]);

  useEffect(() => {
    if (!selectedDoctor) return;

    if (!appointment || appointment.doctorId !== selectedDoctor.id) {
      const defaultPrice = selectedDoctor.appointmentPriceInCents / 100;
      if (form.getValues('appointmentPrice') !== defaultPrice) {
        form.setValue('appointmentPrice', defaultPrice, { shouldDirty: !appointment, shouldValidate: true });
      }
    }

    const currentDate = form.getValues('date');
    if (currentDate && !isDateAllowedForDoctor(currentDate, selectedDoctor)) {
      form.setValue('date', null, { shouldDirty: true, shouldValidate: true });
      form.setValue('time', '', { shouldDirty: true, shouldValidate: true });
      toast.error('A data escolhida não está dentro da agenda deste médico.');
    }
  }, [appointment, form, selectedDoctor]);

  const { data: availableTimesResponse, isFetching: loadingTimes } = useQuery({
    queryKey: ['available-times', selectedDoctorId, selectedDateKey, appointment?.id ?? 'new'],
    queryFn: () =>
      getAvailableTimes({
        doctorId: selectedDoctorId,
        date: selectedDateKey,
        appointmentId: appointment?.id,
      }),
    enabled: Boolean(isOpen && selectedDoctorId && selectedDateKey),
  });

  const availableTimeOptions = availableTimesResponse?.data ?? [];
  const availableTimeGroups = useMemo(() => splitAvailableTimeGroups(availableTimeOptions), [availableTimeOptions]);

  useEffect(() => {
    if (!selectedTime) return;
    const stillAvailable = availableTimeOptions.some((option) => option.label === selectedTime && option.available);
    if (!stillAvailable) {
      form.setValue('time', '', { shouldValidate: true });
    }
  }, [availableTimeOptions, form, selectedTime]);

  const appointmentAction = useAction(addAppointment, {
    onSuccess: () => {
      toast.success(appointment ? 'Agendamento atualizado com sucesso.' : 'Agendamento criado com sucesso.');
      onSuccess?.();
      onClose?.();
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível salvar o agendamento.');
    },
  });

  function handleDateSelection(nextDate: Date | null | undefined) {
    if (!nextDate) {
      form.setValue('date', null, { shouldDirty: true, shouldValidate: true });
      form.setValue('time', '', { shouldDirty: true, shouldValidate: true });
      return;
    }

    if (isPastDate(nextDate)) {
      toast.error('Não é permitido selecionar datas anteriores ao dia atual.');
      return;
    }

    if (selectedDoctor && !isDateAllowedForDoctor(nextDate, selectedDoctor)) {
      toast.error('A data escolhida não está dentro da agenda deste médico.');
      return;
    }

    form.setValue('date', nextDate, { shouldDirty: true, shouldValidate: true });
    form.setValue('time', '', { shouldDirty: true, shouldValidate: true });
  }

  function handleSubmit(values: FormOutput) {
    if (!values.date) {
      form.setError('date', { message: 'Data é obrigatória.' });
      return;
    }

    appointmentAction.execute({
      id: appointment?.id,
      patientId: values.patientId,
      doctorId: values.doctorId,
      date: values.date,
      time: values.time,
      appointmentPriceInCents: Math.round(values.appointmentPrice * 100),
      notes: values.notes,
      paymentConfirmed: values.paymentConfirmed,
      paymentMethod: values.paymentConfirmed ? values.paymentMethod ?? 'pix' : null,
    });
  }

  if (!mounted || !isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4">
      <div className="absolute inset-0" onClick={() => onClose?.()} />

      <div className="relative z-[101] max-h-[92vh] w-full max-w-[1080px] overflow-y-auto rounded-[20px] border border-slate-200 bg-white shadow-xl shadow-slate-950/15">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-semibold tracking-tight text-slate-950">{appointment ? 'Editar agendamento' : 'Novo agendamento'}</h2>
              <p className="mt-1.5 text-sm text-slate-500">Preencha os dados do agendamento.</p>
            </div>
            <button
              type="button"
              onClick={() => onClose?.()}
              className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="px-6 py-5 sm:px-7 sm:py-6">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className={cardClass}>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className={titleClass}>Dados do atendimento</h3>
                    <p className="mt-1 text-sm text-slate-500">Paciente, médico, data, horário e pagamento.</p>
                  </div>
                  {selectedDoctor ? (
                    <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 px-3 py-1 text-primary">
                      <Stethoscope className="size-3.5" /> {selectedDoctor.specialty}
                    </Badge>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Paciente</FormLabel>
                        <FormControl>
                          <SearchSelect
                            value={field.value}
                            onChange={field.onChange}
                            items={patients}
                            placeholder="Buscar paciente"
                            searchPlaceholder="Digite o nome do paciente"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="doctorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Médico</FormLabel>
                        <FormControl>
                          <SearchSelect
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                              form.setValue('time', '', { shouldDirty: true, shouldValidate: true });
                            }}
                            items={doctors}
                            placeholder="Buscar médico"
                            searchPlaceholder="Digite o nome ou especialidade"
                            extraLabel={(item) => item.specialty}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => {
                      const minimumDate = getBrazilDateKey(new Date());

                      return (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">Data</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CalendarIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                              <Input
                                type="date"
                                value={getDateInputValue(field.value)}
                                min={minimumDate}
                                disabled={!selectedDoctor}
                                onChange={(event) => handleDateSelection(event.target.value ? parseBrazilDate(event.target.value).toDate() : undefined)}
                                className={cn(inputClass, 'pl-11', !selectedDoctor && 'cursor-not-allowed bg-slate-50 text-slate-400')}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="appointmentPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Valor da consulta</FormLabel>
                        <FormControl>
                          <NumericFormat
                            value={field.value}
                            onValueChange={(value) => field.onChange(value.floatValue ?? 0)}
                            decimalScale={2}
                            fixedDecimalScale
                            decimalSeparator=","
                            thousandSeparator="."
                            prefix="R$ "
                            allowNegative={false}
                            customInput={Input}
                            className={inputClass}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm font-medium text-slate-700">Observações</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            value={field.value ?? ''}
                            placeholder="Observações internas do atendimento"
                            className="min-h-[92px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <div className="space-y-4">
                <section className={cardClass}>
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <Clock3 className="size-4 text-primary" />
                      <h3 className={titleClass}>Horários disponíveis</h3>
                    </div>
                    {selectedDate && minimumBookableTime && isSameBrazilDay(selectedDate, new Date()) ? (
                      <p className="mt-1 text-xs text-slate-500">Hoje são exibidos apenas horários a partir de {minimumBookableTime.slice(0, 5)}.</p>
                    ) : null}
                  </div>

                  {selectedDoctor ? (
                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">{selectedDoctor.name}</div>
                      <div className="mt-1 text-sm text-slate-500">{selectedDoctor.specialty} • Valor padrão {formatCurrencyInCents(selectedDoctor.appointmentPriceInCents)}</div>
                    </div>
                  ) : null}

                  {!selectedDoctor || !selectedDate ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-7 text-center text-sm text-slate-500">
                      Selecione médico e data para liberar os horários.
                    </div>
                  ) : loadingTimes ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-7 text-center text-sm text-slate-500">
                      Carregando horários disponíveis...
                    </div>
                  ) : availableTimeGroups.length ? (
                    <div className="space-y-3">
                      {availableTimeGroups.map((group) => (
                        <div key={group.label} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{group.label}</div>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {group.times.map((time) => {
                              const isSelected = selectedTime === time.label;
                              const isUnavailable = !time.available;

                              return (
                                <Button
                                  key={time.value}
                                  type="button"
                                  variant={isSelected ? 'default' : 'outline'}
                                  className={cn(
                                    'h-9 rounded-lg px-2 text-sm shadow-none',
                                    !isSelected && 'border-slate-200 bg-white hover:bg-primary/5 hover:text-primary',
                                    isUnavailable && 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-100 hover:text-slate-400',
                                  )}
                                  disabled={isUnavailable}
                                  onClick={() => form.setValue('time', time.label, { shouldDirty: true, shouldValidate: true })}
                                >
                                  {time.label}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-7 text-center text-sm text-slate-500">
                      Nenhum horário livre para esta data. Escolha outro dia.
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="time"
                    render={() => (
                      <FormItem className="pt-3">
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <section className={cardClass}>
                  <div className="mb-3 flex items-center gap-2">
                    <CreditCard className="size-4 text-primary" />
                    <h3 className={titleClass}>Pagamento</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 text-sm font-medium text-slate-700">Status</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => form.setValue('paymentConfirmed', false, { shouldDirty: true })}
                          className={cn(
                            choiceButtonClass,
                            !paymentConfirmed
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                          )}
                        >
                          Pendente
                        </button>
                        <button
                          type="button"
                          onClick={() => form.setValue('paymentConfirmed', true, { shouldDirty: true })}
                          className={cn(
                            choiceButtonClass,
                            paymentConfirmed
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                          )}
                        >
                          Pago
                        </button>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">Forma de pagamento</FormLabel>
                          <FormControl>
                            <PaymentMethodPicker
                              value={(field.value ?? 'pix') as any}
                              disabled={!paymentConfirmed}
                              onChange={(value) => field.onChange(value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" className="h-10 rounded-xl border-slate-200 px-5" onClick={() => onClose?.()}>
                Cancelar
              </Button>
              <Button type="submit" className="h-10 rounded-xl px-6" disabled={appointmentAction.isExecuting}>
                {appointment ? 'Salvar alterações' : 'Criar agendamento'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>,
    document.body,
  );
}
