import { entorno } from './entorno';
import { ErrorApi } from './errorApi';

const IDENTITY = 'https://identitytoolkit.googleapis.com/v1/accounts';
const SECURETOKEN = 'https://securetoken.googleapis.com/v1/token';

// Mismo mensaje exista o no el correo (no revela qué cuentas existen).
export const MENSAJE_CREDENCIALES = 'Correo o contraseña incorrectos';

export type Sesion = {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
  usuario: { id: string; email: string };
};

function traducir(datos: Record<string, unknown>): ErrorApi {
  const cuerpo = datos.error as { message?: string } | undefined;
  const codigo = (cuerpo?.message ?? '').split(' ')[0];
  switch (codigo) {
    case 'EMAIL_EXISTS':
      return new ErrorApi(409, 'El correo ya está registrado');
    case 'WEAK_PASSWORD':
      return new ErrorApi(400, 'La contraseña es demasiado débil');
    case 'INVALID_EMAIL':
      return new ErrorApi(400, 'El correo no es válido');
    case 'INVALID_LOGIN_CREDENTIALS':
    case 'EMAIL_NOT_FOUND':
    case 'INVALID_PASSWORD':
    case 'USER_DISABLED':
      return new ErrorApi(401, MENSAJE_CREDENCIALES);
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return new ErrorApi(429, 'Demasiados intentos. Intenta más tarde');
    case 'INVALID_REFRESH_TOKEN':
    case 'TOKEN_EXPIRED':
    case 'USER_NOT_FOUND':
      return new ErrorApi(401, 'La sesión no es válida. Inicia sesión de nuevo');
    default:
      return new ErrorApi(500, 'Error interno');
  }
}

async function llamar(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const clave = encodeURIComponent(entorno().FIREBASE_WEB_API_KEY);
  const res = await fetch(`${url}?key=${clave}`, init);
  const datos = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const e = traducir(datos);
    if (e.status === 500) {
      console.error('firebase auth:', (datos.error as { message?: string } | undefined)?.message ?? 'sin código');
    }
    throw e;
  }
  return datos;
}

function sesionDe(d: Record<string, unknown>): Sesion {
  return {
    token: String(d.idToken),
    refreshToken: String(d.refreshToken),
    expiraEnSeg: Number(d.expiresIn),
    usuario: { id: String(d.localId), email: String(d.email) },
  };
}

function enviar(cuerpo: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  };
}

export async function registrar(email: string, password: string): Promise<Sesion> {
  return sesionDe(await llamar(`${IDENTITY}:signUp`, enviar({ email, password, returnSecureToken: true })));
}

export async function iniciarSesion(email: string, password: string): Promise<Sesion> {
  return sesionDe(
    await llamar(`${IDENTITY}:signInWithPassword`, enviar({ email, password, returnSecureToken: true })),
  );
}

export async function renovar(refreshToken: string) {
  const d = await llamar(SECURETOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  });
  return {
    token: String(d.id_token),
    refreshToken: String(d.refresh_token),
    expiraEnSeg: Number(d.expires_in),
  };
}
