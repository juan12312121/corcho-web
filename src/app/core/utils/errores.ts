import { ErrorApi } from '../models';

export function esErrorApi(e: unknown): e is ErrorApi {
  return typeof e === 'object' && e !== null && 'codigo' in e && 'mensaje' in e;
}

/** Texto para mostrarle a la persona, venga de donde venga el error. */
export function mensajeDeError(e: unknown): string {
  if (!esErrorApi(e)) return 'Algo salió mal, intenta de nuevo';
  const campo = e.detalles.find((d) => d.mensaje)?.mensaje;
  return e.codigo === 'DATOS_INVALIDOS' && campo ? campo : e.mensaje;
}
