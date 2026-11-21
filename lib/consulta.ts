import { z } from 'zod';

import { ErrorApi } from './errorApi';

const esquemaSince = z.string().datetime({ message: 'since debe ser una fecha ISO 8601 en UTC' });

export function leerSince(req: Request): string | null {
  const valor = new URL(req.url).searchParams.get('since');
  if (valor === null || valor === '') return null;
  const r = esquemaSince.safeParse(valor);
  if (!r.success) {
    throw new ErrorApi(400, 'Datos inválidos', [
      { campo: 'since', mensaje: r.error.issues[0]?.message ?? 'Fecha inválida' },
    ]);
  }
  return r.data;
}
