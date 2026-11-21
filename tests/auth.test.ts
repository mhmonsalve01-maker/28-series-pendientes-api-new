import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST as login } from '../app/api/auth/login/route';
import { POST as registro } from '../app/api/auth/registro/route';
import { GET as yo } from '../app/api/auth/yo/route';

vi.mock('../lib/firebaseAdmin', () => ({
  adminAuth: () => ({
    verifyIdToken: async (token: string) => {
      if (token === 'token-valido') return { uid: 'u1', email: 'a@b.co' };
      throw new Error('token inválido');
    },
  }),
}));

function peticion(ruta: string, cuerpo: unknown) {
  return new Request(`http://localhost${ruta}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
}

function fingirFirebase(codigo: string) {
  vi.stubEnv('FIREBASE_PROJECT_ID', 'p');
  vi.stubEnv('FIREBASE_CLIENT_EMAIL', 'c');
  vi.stubEnv('FIREBASE_PRIVATE_KEY', 'k');
  vi.stubEnv('FIREBASE_WEB_API_KEY', 'w');
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ error: { message: codigo } }), { status: 400 })),
    ),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('GET /api/auth/yo (autenticación)', () => {
  it('sin token => 401', async () => {
    const res = await yo(new Request('http://localhost/api/auth/yo'));
    expect(res.status).toBe(401);
  });
  it('token inválido => 401', async () => {
    const res = await yo(
      new Request('http://localhost/api/auth/yo', { headers: { authorization: 'Bearer malo' } }),
    );
    expect(res.status).toBe(401);
  });
  it('token válido => 200 con el uid del token', async () => {
    const res = await yo(
      new Request('http://localhost/api/auth/yo', { headers: { authorization: 'Bearer token-valido' } }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).usuario.id).toBe('u1');
  });
});

describe('POST /api/auth/registro (validación)', () => {
  it('correo y contraseña inválidos => 400 con detalles por campo', async () => {
    const res = await registro(peticion('/api/auth/registro', { email: 'no-es-correo', password: '123' }));
    expect(res.status).toBe(400);
    const cuerpo = await res.json();
    expect(cuerpo.detalles.map((d: { campo: string }) => d.campo).sort()).toEqual(['email', 'password']);
  });
  it('sin Content-Type JSON => 415', async () => {
    const res = await registro(
      new Request('http://localhost/api/auth/registro', { method: 'POST', body: '{}' }),
    );
    expect(res.status).toBe(415);
  });
  it('correo repetido => 409', async () => {
    fingirFirebase('EMAIL_EXISTS');
    const res = await registro(peticion('/api/auth/registro', { email: 'a@b.co', password: 'Clave12345' }));
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('correo inexistente y contraseña incorrecta dan exactamente la misma respuesta 401', async () => {
    fingirFirebase('EMAIL_NOT_FOUND');
    const a = await login(peticion('/api/auth/login', { email: 'a@b.co', password: 'x' }));
    const cuerpoA = await a.json();
    fingirFirebase('INVALID_PASSWORD');
    const b = await login(peticion('/api/auth/login', { email: 'a@b.co', password: 'x' }));
    const cuerpoB = await b.json();
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(cuerpoA).toEqual(cuerpoB);
  });
});
