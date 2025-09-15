import { z } from 'zod'

export const createUserSchema = z.object({
  rut: z.string().min(3),
  nombres: z.string().min(1),
  apellidos: z.string().min(1),
  sexo_id: z.string().min(1), // can be id or label
  email: z.string().email(),
  telefono: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  rol_id: z.string().min(1), // can be id or label
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.boolean().optional(),
})

export const updateUserSchema = createUserSchema.partial()

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
