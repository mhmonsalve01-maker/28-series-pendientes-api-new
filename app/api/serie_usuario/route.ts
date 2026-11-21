import { usuarioDeLaPeticion } from '../../../lib/auth';
import { leerSince } from '../../../lib/consulta';
import { error } from '../../../lib/errores';
import { manejar } from '../../../lib/manejador';
import { listar } from '../../../lib/serieUsuario';

export const runtime = 'nodejs';

export function GET(req: Request) {
  return manejar(async () => {
    const u = await usuarioDeLaPeticion(req);
    if (!u) return error(401, 'No autenticado');
    const items = await listar(u.uid, leerSince(req));
    return Response.json({ items, servidor_ahora: new Date().toISOString() });
  });
}
