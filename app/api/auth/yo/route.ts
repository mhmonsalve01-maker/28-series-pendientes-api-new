import { usuarioDeLaPeticion } from '../../../../lib/auth';
import { error } from '../../../../lib/errores';
import { manejar } from '../../../../lib/manejador';

export const runtime = 'nodejs';

export function GET(req: Request) {
  return manejar(async () => {
    const u = await usuarioDeLaPeticion(req);
    if (!u) return error(401, 'No autenticado');
    return Response.json({ usuario: { id: u.uid, email: u.email, rol: u.rol } });
  });
}
