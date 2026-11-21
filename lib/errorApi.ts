import type { DetalleError } from './errores';

export class ErrorApi extends Error {
  status: number;
  detalles?: DetalleError[];

  constructor(status: number, mensaje: string, detalles?: DetalleError[]) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}
