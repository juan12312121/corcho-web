/** Forma de todas las respuestas del backend. */
export interface RespuestaApi<T> {
  ok: true;
  data: T;
  meta?: MetaPagina;
}

export interface MetaPagina {
  total: number;
  pagina: number;
  porPagina: number;
}

export interface ErrorApi {
  status: number;
  codigo: string;
  mensaje: string;
  detalles: { campo?: string; mensaje?: string }[];
}
