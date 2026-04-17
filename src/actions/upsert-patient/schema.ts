import { z } from 'zod';

const optionalEmail = z.string().trim().refine((value) => value === '' || z.string().email().safeParse(value).success, {
  message: 'Email inválido.',
}).transform((value) => value || null);

const optionalPhoneNumber = z.string().trim().refine((value) => value === '' || value.replace(/\D/g, '').length >= 10, {
  message: 'Informe um telefone válido.',
}).transform((value) => value.replace(/\D/g, '') || null);

export const upsertPatientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, { message: 'Nome é obrigatório.' }),
  email: optionalEmail,
  phoneNumber: optionalPhoneNumber,
  address: z.string().trim().optional().nullable(),
  sex: z.enum(['male', 'female'], { required_error: 'Sexo é obrigatório.' }),
});

export type UpsertPatientSchema = z.infer<typeof upsertPatientSchema>;
