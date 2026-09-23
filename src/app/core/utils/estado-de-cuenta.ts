import { Movimiento } from '../models';
import { normalizar } from './textos';

/** Una fila ya interpretada, con lo necesario para revisarla antes de importar. */
export interface MovimientoLeido extends Movimiento {
  linea: number;
  incluido: boolean;
}

export interface Lectura {
  movimientos: MovimientoLeido[];
  /** Filas que no se pudieron leer (se muestran para que la persona sepa) */
  ignoradas: number;
}

const MESES: Record<string, number> = {
  ene: 1, jan: 1, feb: 2, mar: 3, abr: 4, apr: 4, may: 5, jun: 6, jul: 7, ago: 8, aug: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12, dec: 12,
};

const COLUMNAS = {
  fecha: /fecha|date|^dia$/,
  concepto: /descrip|concepto|detalle|movimiento|referencia|comercio|establecimiento|description|memo/,
  cargo: /cargo|retiro|debito|egreso|withdraw|debit|gasto/,
  abono: /abono|deposito|credito|ingreso|deposit|credit/,
  monto: /monto|importe|amount|cantidad|valor/,
};

/** CSV con comillas; detecta si separa con coma, punto y coma o tabulador. */
export function leerCsv(texto: string): string[][] {
  const limpio = texto.replace(/^﻿/, '');
  const primera = limpio.split(/\r?\n/, 1)[0] ?? '';
  const separador = [',', ';', '\t'].reduce((a, b) => (primera.split(b).length > primera.split(a).length ? b : a));
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = '';
  let enComillas = false;
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (enComillas) {
      if (c === '"' && limpio[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') enComillas = false;
      else celda += c;
    } else if (c === '"') enComillas = true;
    else if (c === separador) {
      fila.push(celda.trim());
      celda = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && limpio[i + 1] === '\n') i++;
      fila.push(celda.trim());
      if (fila.some(Boolean)) filas.push(fila);
      fila = [];
      celda = '';
    } else celda += c;
  }
  fila.push(celda.trim());
  if (fila.some(Boolean)) filas.push(fila);
  return filas;
}

/** "$1,234.56", "(85.50)", "85.50-", "-1 200" → número (negativo si viene como cargo). */
export function leerMonto(texto: string): number | null {
  let t = (texto ?? '').replace(/[$\s]|MXN|USD/gi, '');
  if (!t) return null;
  let signo = 1;
  if (/^\(.*\)$/.test(t) || t.endsWith('-')) {
    signo = -1;
    t = t.replace(/[()]/g, '').replace(/-$/, '');
  }
  if (t.startsWith('-')) {
    signo = -1;
    t = t.slice(1);
  }
  // Coma decimal (1.234,56 o 98,00) → 1234.56 / 98 ; coma de miles (1,234.56 o 1,234) → 1234.56 / 1234
  const comaDecimal = /,\d{1,2}$/.test(t) && (t.includes('.') || /^\d+,\d{1,2}$/.test(t));
  t = comaDecimal ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  const n = Number(t);
  return Number.isFinite(n) && n !== 0 ? Math.round(signo * n * 100) / 100 : null;
}

/** 2026-09-05, 05/09/2026, 5-9-26, "05 SEP 2026", "05/sep/2026" → '2026-09-05'. */
export function leerFecha(texto: string): string | null {
  const t = normalizar((texto ?? '').trim());
  let a: number, m: number, d: number;
  let r = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(t);
  if (r) [a, m, d] = [Number(r[1]), Number(r[2]), Number(r[3])];
  else if ((r = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(t))) [d, m, a] = [Number(r[1]), Number(r[2]), Number(r[3])];
  else if ((r = /^(\d{1,2})[-/. ]([a-z]{3})[a-z]*[-/. ](\d{2,4})/.exec(t)) && MESES[r[2]]) [d, m, a] = [Number(r[1]), MESES[r[2]], Number(r[3])];
  else return null;
  if (a < 100) a += 2000;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Convierte las filas del CSV del banco en movimientos. Entiende dos formatos:
 *  - columnas separadas de cargo y abono (lo común en bancos mexicanos)
 *  - una sola columna de monto: negativo = gasto, positivo = ingreso
 *    (si todos son positivos, como en tarjeta de crédito, todos son gastos)
 */
export function interpretarEstadoDeCuenta(filas: string[][]): Lectura {
  const iEncabezado = filas.slice(0, 15).findIndex((f) => f.some((c) => COLUMNAS.fecha.test(normalizar(c))));
  const encabezado = iEncabezado >= 0 ? filas[iEncabezado].map((c) => normalizar(c)) : [];
  const columna = (patron: RegExp, excepto: number[] = []) => encabezado.findIndex((c, i) => !excepto.includes(i) && patron.test(c));

  const cFecha = iEncabezado >= 0 ? columna(COLUMNAS.fecha) : 0;
  const cConcepto = iEncabezado >= 0 ? columna(COLUMNAS.concepto, [cFecha]) : 1;
  const cCargo = columna(COLUMNAS.cargo);
  const cAbono = columna(COLUMNAS.abono, [cCargo]);
  const cMonto = iEncabezado >= 0 ? columna(COLUMNAS.monto, [cCargo, cAbono]) : 2;
  const separadas = cCargo >= 0 || cAbono >= 0;

  const datos = filas.slice(iEncabezado + 1);
  const montosSueltos = separadas ? [] : datos.map((f) => leerMonto(f[cMonto] ?? '')).filter((n): n is number => n !== null);
  const todosPositivos = montosSueltos.length > 0 && montosSueltos.every((n) => n > 0);

  const movimientos: MovimientoLeido[] = [];
  let ignoradas = 0;
  datos.forEach((f, i) => {
    const fecha = leerFecha(f[cFecha] ?? '');
    const titulo = (f[cConcepto] ?? '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Movimiento';
    let monto: number | null;
    if (separadas) {
      const cargo = cCargo >= 0 ? leerMonto(f[cCargo] ?? '') : null;
      const abono = cAbono >= 0 ? leerMonto(f[cAbono] ?? '') : null;
      monto = cargo ? -Math.abs(cargo) : abono ? Math.abs(abono) : null;
    } else {
      const bruto = leerMonto(f[cMonto] ?? '');
      monto = bruto === null ? null : todosPositivos ? -bruto : bruto;
    }
    if (!fecha || monto === null) {
      ignoradas++;
      return;
    }
    movimientos.push({ linea: iEncabezado + 2 + i, tipo: monto < 0 ? 'gasto' : 'ingreso', titulo, monto: Math.abs(monto), fecha, incluido: true });
  });
  return { movimientos, ignoradas };
}
