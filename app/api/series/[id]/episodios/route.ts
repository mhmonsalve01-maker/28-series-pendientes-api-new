import { usuarioDeLaPeticion } from '../../../../../lib/auth';
import { ErrorApi } from '../../../../../lib/errorApi';
import { error } from '../../../../../lib/errores';
import { esquemaId } from '../../../../../lib/esquemasSerie';
import { manejar } from '../../../../../lib/manejador';
import { episodios } from '../../../../../lib/tvmaze';

export const runtime = 'nodejs';

type Contexto = { params: Promise<{ id: string }> };

export function GET(req: Request, ctx: Contexto) {
  return manejar(async () => {
    const u = await usuarioDeLaPeticion(req);
    if (!u) return error(401, 'No autenticado');
    const r = esquemaId.safeParse((await ctx.params).id);
    if (!r.success) {
      throw new ErrorApi(400, 'Datos inválidos', [
        { campo: 'id', mensaje: r.error.issues[0]?.message ?? 'Id inválido' },
      ]);
    }
    return Response.json({ items: await episodios(r.data) });
  });
}
