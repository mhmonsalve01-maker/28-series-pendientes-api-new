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

const esquemaPagina = z.string().regex(/^\d{1,3}$/, 'pagina debe ser un entero entre 0 y 999');

export function leerPagina(req: Request): number {
  const valor = new URL(req.url).searchParams.get('pagina');
  if (valor === null || valor === '') return 0;
  const r = esquemaPagina.safeParse(valor);
  if (!r.success) {
    throw new ErrorApi(400, 'Datos inválidos', [
      { campo: 'pagina', mensaje: r.error.issues[0]?.message ?? 'Página inválida' },
    ]);
  }
  return Number(r.data);
}
