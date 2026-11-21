import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET as episodiosRuta } from '../app/api/series/[id]/episodios/route';
import { GET as descubrir } from '../app/api/series/descubrir/route';
import { limpiarHtml, vaciarCache } from '../lib/tvmaze';

vi.mock('../lib/firebaseAdmin', () => ({
  adminAuth: () => ({
    verifyIdToken: async (token: string) => {
      if (token === 'token-a') return { uid: 'ua', email: 'a@b.co' };
      throw new Error('token inválido');
    },
  }),
}));

vi.mock('../lib/serieUsuario', () => ({
  idsDecididas: async () => new Set([2]),
}));

function fingirTvmaze(cuerpo: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(cuerpo), { status }))),
  );
}

function peticion(ruta: string, token?: string) {
  return new Request(`http://localhost${ruta}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

const shows = [
  { id: 1, name: 'A', genres: ['Drama'], summary: '<p>Hola &amp; adiós</p>', image: { medium: 'http://x/a.jpg' }, weight: 50 },
  { id: 2, name: 'B', genres: [], summary: null, image: null, weight: 99 },
  { id: 3, name: 'C', genres: ['Comedia', 'Drama'], summary: null, image: null, weight: 90 },
  { id: 'roto' },
];

beforeEach(() => vaciarCache());
afterEach(() => vi.unstubAllGlobals());

describe('limpiarHtml', () => {
  it('quita etiquetas y decodifica entidades', () => {
    expect(limpiarHtml('<p>Hola &amp; <b>adiós</b></p>')).toBe('Hola & adiós');
  });
  it('vacío o nulo => null', () => {
    expect(limpiarHtml('<p></p>')).toBeNull();
    expect(limpiarHtml(null)).toBeNull();
  });
});

describe('GET /api/series/descubrir', () => {
  it('sin token => 401', async () => {
    expect((await descubrir(peticion('/api/series/descubrir'))).status).toBe(401);
  });
  it('pagina inválida => 400', async () => {
    const res = await descubrir(peticion('/api/series/descubrir?pagina=abc', 'token-a'));
    expect(res.status).toBe(400);
  });
  it('excluye las decididas, ordena por popularidad e ignora entradas rotas', async () => {
    fingirTvmaze(shows);
    const res = await descubrir(peticion('/api/series/descubrir', 'token-a'));
    expect(res.status).toBe(200);
    const { items } = await res.json();
    expect(items.map((s: { id: number }) => s.id)).toEqual([3, 1]);
    expect(items[1].resumen).toBe('Hola & adiós');
    expect(items[1].imagen_url).toBe('https://x/a.jpg');
    expect(items[0].generos).toBe('Comedia, Drama');
  });
  it('página más allá del final => lista vacía', async () => {
    fingirTvmaze({}, 404);
    const res = await descubrir(peticion('/api/series/descubrir?pagina=999', 'token-a'));
    expect(res.status).toBe(200);
    expect((await res.json()).items).toEqual([]);
  });
});

describe('GET /api/series/:id/episodios', () => {
  it('sin token => 401', async () => {
    expect((await episodiosRuta(peticion('/api/series/1/episodios'), ctx('1'))).status).toBe(401);
  });
  it('id no numérico => 400', async () => {
    const res = await episodiosRuta(peticion('/api/series/abc/episodios', 'token-a'), ctx('abc'));
    expect(res.status).toBe(400);
  });
  it('serie inexistente en TVMaze => 404', async () => {
    fingirTvmaze({}, 404);
    const res = await episodiosRuta(peticion('/api/series/9/episodios', 'token-a'), ctx('9'));
    expect(res.status).toBe(404);
  });
  it('devuelve los episodios normalizados', async () => {
    fingirTvmaze([
      { id: 10, name: 'Piloto', season: 1, number: 1, airdate: '2008-01-20' },
      { id: 11, name: 'Especial', season: 1, number: null, airdate: '' },
    ]);
    const res = await episodiosRuta(peticion('/api/series/169/episodios', 'token-a'), ctx('169'));
    expect(res.status).toBe(200);
    const { items } = await res.json();
    expect(items).toEqual([
      { id: 10, temporada: 1, numero: 1, nombre: 'Piloto', fecha_emision: '2008-01-20' },
      { id: 11, temporada: 1, numero: null, nombre: 'Especial', fecha_emision: null },
    ]);
  });
});
