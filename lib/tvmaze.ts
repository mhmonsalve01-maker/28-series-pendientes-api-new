import { z } from 'zod';

import { ErrorApi } from './errorApi';

const BASE = 'https://api.tvmaze.com';
const TTL_MS = 60 * 60 * 1000;
const MAX_ENTRADAS = 200;

const cache = new Map<string, { vence: number; datos: unknown }>();

export function vaciarCache() {
  cache.clear();
}

export type SerieCatalogo = {
  id: number;
  nombre: string;
  imagen_url: string | null;
  resumen: string | null;
  generos: string;
  popularidad: number;
};

export type Episodio = {
  id: number;
  temporada: number;
  numero: number | null;
  nombre: string;
  fecha_emision: string | null;
};

const esquemaShow = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  genres: z.array(z.string()).nullish(),
  summary: z.string().nullish(),
  image: z.object({ medium: z.string().nullish() }).nullish(),
  weight: z.number().nullish(),
});

const esquemaEpisodio = z.object({
  id: z.number().int(),
  name: z.string(),
  season: z.number().int(),
  number: z.number().int().nullish(),
  airdate: z.string().nullish(),
});

export function limpiarHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const texto = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return texto === '' ? null : texto;
}

function https(url: string | null | undefined): string | null {
  return url ? url.replace(/^http:/, 'https:') : null;
}

async function pedir(ruta: string): Promise<unknown> {
  const guardado = cache.get(ruta);
  if (guardado && guardado.vence > Date.now()) return guardado.datos;

  let res: Response;
  try {
    res = await fetch(BASE + ruta, { signal: AbortSignal.timeout(8000) });
  } catch {
    throw new ErrorApi(500, 'Error interno');
  }
  if (res.status === 404) throw new ErrorApi(404, 'No existe');
  if (res.status === 429) throw new ErrorApi(429, 'Demasiadas consultas. Intenta más tarde');
  if (!res.ok) throw new ErrorApi(500, 'Error interno');

  const datos: unknown = await res.json();
  if (cache.size >= MAX_ENTRADAS) cache.clear();
  cache.set(ruta, { vence: Date.now() + TTL_MS, datos });
  return datos;
}

export async function populares(pagina: number): Promise<SerieCatalogo[]> {
  let crudo: unknown;
  try {
    crudo = await pedir(`/shows?page=${pagina}`);
  } catch (e) {
    if (e instanceof ErrorApi && e.status === 404) return []; // página más allá del final
    throw e;
  }
  if (!Array.isArray(crudo)) return [];
  return crudo.flatMap((x) => {
    const r = esquemaShow.safeParse(x);
    if (!r.success) return [];
    const s = r.data;
    return [
      {
        id: s.id,
        nombre: s.name,
        imagen_url: https(s.image?.medium),
        resumen: limpiarHtml(s.summary),
        generos: (s.genres ?? []).join(', '),
        popularidad: s.weight ?? 0,
      },
    ];
  });
}

// Excluye las series que el usuario ya decidió y ordena por popularidad.
export function ordenarPopulares(
  series: SerieCatalogo[],
  excluidas: Set<number>,
  limite: number,
): SerieCatalogo[] {
  return series
    .filter((s) => !excluidas.has(s.id))
    .sort((a, b) => b.popularidad - a.popularidad)
    .slice(0, limite);
}

export async function episodios(id: string): Promise<Episodio[]> {
  const crudo = await pedir(`/shows/${id}/episodes`);
  if (!Array.isArray(crudo)) return [];
  return crudo.flatMap((x) => {
    const r = esquemaEpisodio.safeParse(x);
    if (!r.success) return [];
    const e = r.data;
    return [
      {
        id: e.id,
        temporada: e.season,
        numero: e.number ?? null,
        nombre: e.name,
        fecha_emision: e.airdate || null,
      },
    ];
  });
}
