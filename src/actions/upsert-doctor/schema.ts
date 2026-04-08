import { z } from 'zod';

export const availabilityRangeSchema = z.object({
  id: z.string().optional(),
  startDate: z.string().min(1, { message: 'Data inicial é obrigatória.' }),
  endDate: z.string().min(1, { message: 'Data final é obrigatória.' }),
  fromTime: z.string().min(1, { message: 'Hora inicial é obrigatória.' }),
  toTime: z.string().min(1, { message: 'Hora final é obrigatória.' }),
});

export const upsertDoctorSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, { message: 'Nome é obrigatório.' }),
  specialty: z.string().trim().min(1, { message: 'Especialidade é obrigatória.' }),
  crm: z.string().trim().min(1, { message: 'CRM é obrigatório.' }),
  appointmentPriceInCents: z.number().min(1, { message: 'Preço da consulta é obrigatório.' }),
  availabilityRanges: z.array(availabilityRangeSchema).min(1, { message: 'Adicione ao menos um período de atendimento.' }),
});

export type UpsertDoctorSchema = z.infer<typeof upsertDoctorSchema>;
