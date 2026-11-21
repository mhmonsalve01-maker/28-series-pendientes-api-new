import { registrar } from '../../../../lib/authFirebase';
import { leerCuerpo } from '../../../../lib/cuerpo';
import { esquemaRegistro } from '../../../../lib/esquemasAuth';
import { manejar } from '../../../../lib/manejador';

export const runtime = 'nodejs';

export function POST(req: Request) {
  return manejar(async () => {
    const { email, password } = await leerCuerpo(req, esquemaRegistro);
    return Response.json(await registrar(email, password), { status: 201 });
  });
}
