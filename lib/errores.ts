export type DetalleError = { campo: string; mensaje: string };

export function error(status: number, mensaje: string, detalles?: DetalleError[]) {
  return Response.json(detalles ? { error: mensaje, detalles } : { error: mensaje }, { status });
}

// Los errores internos nunca devuelven detalles al cliente.
export function errorInterno() {
  return error(500, 'Error interno');
}
