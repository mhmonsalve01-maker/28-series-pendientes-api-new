import { usuarioDeLaPeticion } from '../../../../lib/auth';
import { ErrorApi } from '../../../../lib/errorApi';
import { leerCuerpo } from '../../../../lib/cuerpo';
import { error } from '../../../../lib/errores';
import { esquemaId, esquemaSerieUsuario } from '../../../../lib/esquemasSerie';
import { manejar } from '../../../../lib/manejador';
import { borrar, guardar } from '../../../../lib/serieUsuario';

export const runtime = 'nodejs';

type Contexto = { params: Promise<{ id: string }> };

async function leerId(ctx: Contexto): Promise<string> {
  const r = esquemaId.safeParse((await ctx.params).id);
  if (!r.success) {
    throw new ErrorApi(400, 'Datos inválidos', [{ campo: 'id', mensaje: r.error.issues[0]?.message ?? 'Id inválido' }]);
  }
  return r.data;
}

export function PUT(req: Request, ctx: Contexto) {
  return manejar(async () => {
    const u = await usuarioDeLaPeticion(req);
    if (!u) return error(401, 'No autenticado');
    const id = await leerId(ctx);
    const datos = await leerCuerpo(req, esquemaSerieUsuario);
    return Response.json(await guardar(u.uid, id, datos), { status: 200 });
  });
}

export function DELETE(req: Request, ctx: Contexto) {
  return manejar(async () => {
    const u = await usuarioDeLaPeticion(req);
    if (!u) return error(401, 'No autenticado');
    const id = await leerId(ctx);
    if (!(await borrar(u.uid, id))) return error(404, 'No existe');
    return Response.json({ ok: true });
  });
}
