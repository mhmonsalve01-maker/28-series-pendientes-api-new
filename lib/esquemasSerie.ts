import { z } from 'zod';

export const esquemaId = z.string().regex(/^\d{1,12}$/, 'El id debe ser numérico');

export const esquemaSerieUsuario = z.object({
  nombre: z
    .string({ message: 'El nombre es obligatorio' })
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(200, 'El nombre es demasiado largo'),
  imagen_url: z.string().url('La imagen debe ser una URL válida').max(500).nullable().default(null),
  estado: z.enum(['quiero', 'viendo', 'vista', 'descartada'], { message: 'Estado inválido' }),
  temporada_actual: z.number().int('Debe ser un entero').min(1, 'Debe ser mayor o igual a 1').nullable().default(null),
  episodio_actual: z.number().int('Debe ser un entero').min(1, 'Debe ser mayor o igual a 1').nullable().default(null),
});

export type DatosSerieUsuario = z.infer<typeof esquemaSerieUsuario>;
