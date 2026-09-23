import { normalizar } from './textos';

type Celda =string | number | null | undefined;

/** Comillas solo cuando hacen falta; las internas se duplican (regla de CSV). */
function celda(valor: Celda): string {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * Descarga una tabla como CSV que Excel abre directo. Lleva BOM para que
 * respete acentos y "ñ".
 */
export function descargarCsv(nombreArchivo: string, filas: Celda[][]): void {
  const contenido = '﻿' + filas.map((fila) => fila.map(celda).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "Casa Pérez" → "casa-perez" para nombres de archivo. */
export function aNombreArchivo(texto: string): string {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
