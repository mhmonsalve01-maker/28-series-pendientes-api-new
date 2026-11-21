import { renovar } from '../../../../lib/authFirebase';
import { leerCuerpo } from '../../../../lib/cuerpo';
import { esquemaRefresh } from '../../../../lib/esquemasAuth';
import { manejar } from '../../../../lib/manejador';

export const runtime = 'nodejs';

export function POST(req: Request) {
  return manejar(async () => {
    const { refreshToken } = await leerCuerpo(req, esquemaRefresh);
    return Response.json(await renovar(refreshToken), { status: 200 });
  });
}
