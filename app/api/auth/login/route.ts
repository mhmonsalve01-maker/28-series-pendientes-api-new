import { iniciarSesion } from '../../../../lib/authFirebase';
import { leerCuerpo } from '../../../../lib/cuerpo';
import { esquemaLogin } from '../../../../lib/esquemasAuth';
import { manejar } from '../../../../lib/manejador';

export const runtime = 'nodejs';

export function POST(req: Request) {
  return manejar(async () => {
    const { email, password } = await leerCuerpo(req, esquemaLogin);
    return Response.json(await iniciarSesion(email, password), { status: 200 });
  });
}
