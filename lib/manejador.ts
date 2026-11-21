import { ErrorApi } from './errorApi';
import { error, errorInterno } from './errores';

// Convierte cualquier excepción en la respuesta con el formato del documento.
// Nunca registra contraseñas, tokens ni datos personales: solo el nombre del error.
export async function manejar(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ErrorApi) {
      return error(e.status, e.message, e.detalles);
    }
    console.error('error interno:', e instanceof Error ? e.name : 'desconocido');
    return errorInterno();
  }
}
