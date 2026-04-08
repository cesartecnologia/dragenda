import { z } from 'zod';

export const upsertSpecialtySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, { message: 'Nome da especialidade é obrigatório.' }),
});
