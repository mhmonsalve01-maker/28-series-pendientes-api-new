import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DELETE, PUT } from '../app/api/serie_usuario/[id]/route';
import { GET } from '../app/api/serie_usuario/route';

const { almacen } = vi.hoisted(() => ({ almacen: new Map<string, Record<string, unknown>>() }));

vi.mock('../lib/firebaseAdmin', () => ({
  adminAuth: () => ({
    verifyIdToken: async (token: string) => {
      if (token === 'token-a') return { uid: 'ua', email: 'a@b.co' };
      if (token === 'token-b') return { uid: 'ub', email: 'b@b.co' };
      throw new Error('token inválido');
    },
  }),
}));

vi.mock('../lib/serieUsuario', () => ({
  listar: async (uid: string) =>
    [...almacen.entries()]
      .filter(([clave]) => clave.startsWith(`${uid}/`))
      .map(([clave, valor]) => ({ id: clave.split('/')[1], ...valor })),
  guardar: async (uid: string, id: string, datos: Record<string, unknown>) => {
    const doc = { ...datos, created_at: 't', updated_at: 't', deleted_at: null };
    almacen.set(`${uid}/${id}`, doc);
    return { id, ...doc };
  },
  borrar: async (uid: string, id: string) => almacen.delete(`${uid}/${id}`),
}));

const valida = { nombre: 'Dark', imagen_url: null, estado: 'quiero', temporada_actual: 1, episodio_actual: 2 };

function peticion(metodo: string, ruta: string, token?: string, cuerpo?: unknown) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request(`http://localhost${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => almacen.clear());

describe('autenticación', () => {
  it('GET, PUT y DELETE sin token => 401', async () => {
    expect((await GET(peticion('GET', '/api/serie_usuario'))).status).toBe(401);
    expect((await PUT(peticion('PUT', '/api/serie_usuario/100', undefined, valida), ctx('100'))).status).toBe(401);
    expect((await DELETE(peticion('DELETE', '/api/serie_usuario/100'), ctx('100'))).status).toBe(401);
  });
});

describe('validación', () => {
  it('estado y temporada inválidos => 400 con detalles por campo', async () => {
    const res = await PUT(
      peticion('PUT', '/api/serie_usuario/100', 'token-a', { ...valida, estado: 'otra', temporada_actual: 0 }),
      ctx('100'),
    );
    expect(res.status).toBe(400);
    const campos = (await res.json()).detalles.map((d: { campo: string }) => d.campo).sort();
    expect(campos).toEqual(['estado', 'temporada_actual']);
  });
  it('id no numérico => 400', async () => {
    const res = await PUT(peticion('PUT', '/api/serie_usuario/abc', 'token-a', valida), ctx('abc'));
    expect(res.status).toBe(400);
  });
  it('since inválido => 400', async () => {
    const res = await GET(peticion('GET', '/api/serie_usuario?since=ayer', 'token-a'));
    expect(res.status).toBe(400);
  });
});

describe('autorización (aislamiento entre usuarios)', () => {
  it('un usuario no ve los datos de otro', async () => {
    await PUT(peticion('PUT', '/api/serie_usuario/100', 'token-a', valida), ctx('100'));
    const deA = await (await GET(peticion('GET', '/api/serie_usuario', 'token-a'))).json();
    const deB = await (await GET(peticion('GET', '/api/serie_usuario', 'token-b'))).json();
    expect(deA.items).toHaveLength(1);
    expect(deB.items).toHaveLength(0);
  });
  it('un usuario no puede borrar lo de otro (404) y el dato sigue ahí', async () => {
    await PUT(peticion('PUT', '/api/serie_usuario/100', 'token-a', valida), ctx('100'));
    const res = await DELETE(peticion('DELETE', '/api/serie_usuario/100', 'token-b'), ctx('100'));
    expect(res.status).toBe(404);
    expect(almacen.has('ua/100')).toBe(true);
  });
  it('el uid del cuerpo se ignora: sale del token', async () => {
    await PUT(peticion('PUT', '/api/serie_usuario/100', 'token-a', { ...valida, uid: 'ub', rol: 'admin' }), ctx('100'));
    expect(almacen.has('ua/100')).toBe(true);
    expect(almacen.has('ub/100')).toBe(false);
    expect(almacen.get('ua/100')).not.toHaveProperty('uid');
    expect(almacen.get('ua/100')).not.toHaveProperty('rol');
  });
  it('borrar algo inexistente => 404', async () => {
    const res = await DELETE(peticion('DELETE', '/api/serie_usuario/999', 'token-a'), ctx('999'));
    expect(res.status).toBe(404);
  });
});
