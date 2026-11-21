import { usuarioDeLaPeticion } from '../../../../lib/auth';
import { leerPagina } from '../../../../lib/consulta';
import { error } from '../../../../lib/errores';
import { manejar } from '../../../../lib/manejador';
import { idsDecididas } from '../../../../lib/serieUsuario';
import { ordenarPopulares, populares } from '../../../../lib/tvmaze';

export const runtime = 'nodejs';

const LIMITE = 50;

export function GET(req: Request) {
  return manejar(async () => {
    const u = await usuarioDeLaPeticion(req);
    if (!u) return error(401, 'No autenticado');
    const pagina = leerPagina(req);
    const [catalogo, decididas] = await Promise.all([populares(pagina), idsDecididas(u.uid)]);
    return Response.json({ items: ordenarPopulares(catalogo, decididas, LIMITE), pagina });
  });
}
