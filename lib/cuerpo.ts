import type { z } from 'zod';

import { ErrorApi } from './errorApi';

const LIMITE_BYTES = 10_000;

// Lee y valida el cuerpo JSON: 415 tipo incorrecto, 413 muy grande, 400 inválido.
export async function leerCuerpo<T>(req: Request, esquema: z.ZodType<T>): Promise<T> {
  const tipo = req.headers.get('content-type') ?? '';
  if (!tipo.includes('application/json')) {
    throw new ErrorApi(415, 'El Content-Type debe ser application/json');
  }
  const texto = await req.text();
  if (texto.length > LIMITE_BYTES) {
    throw new ErrorApi(413, 'El cuerpo de la petición es demasiado grande');
  }
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new ErrorApi(400, 'El cuerpo no es un JSON válido');
  }
  const r = esquema.safeParse(datos);
  if (!r.success) {
    throw new ErrorApi(
      400,
      'Datos inválidos',
      r.error.issues.map((i) => ({ campo: i.path.join('.') || 'cuerpo', mensaje: i.message })),
    );
  }
  return r.data;
}
