import { z } from 'zod';

const email = z
  .string({ message: 'El correo es obligatorio' })
  .trim()
  .toLowerCase()
  .email('El correo no es válido')
  .max(254, 'El correo es demasiado largo');

const password = z
  .string({ message: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña es demasiado larga');

export const esquemaRegistro = z.object({ email, password });
export const esquemaLogin = z.object({
  email,
  password: z.string({ message: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria').max(128),
});
export const esquemaRefresh = z.object({
  refreshToken: z.string({ message: 'refreshToken es obligatorio' }).min(1, 'refreshToken es obligatorio').max(2048),
});
