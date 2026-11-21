import { adminAuth } from './firebaseAdmin';

export type Usuario = { uid: string; email: string | null; rol: string | null };

// Devuelve el usuario del ID token verificado, o null si falta o no es válido.
export async function usuarioDeLaPeticion(req: Request): Promise<Usuario | null> {
  const cabecera = req.headers.get('authorization') ?? '';
  const [esquema, token] = cabecera.split(' ');
  if (esquema !== 'Bearer' || !token) return null;
  try {
    const d = await adminAuth().verifyIdToken(token);
    return {
      uid: d.uid,
      email: d.email ?? null,
      rol: typeof d.rol === 'string' ? d.rol : null,
    };
  } catch {
    return null;
  }
}
