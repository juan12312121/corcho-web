import { Pipe, PipeTransform } from '@angular/core';

const formatos = new Map<string, Intl.NumberFormat>();

function formato(moneda: string): Intl.NumberFormat {
  if (!formatos.has(moneda)) {
    try {
      formatos.set(moneda, new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda, minimumFractionDigits: 2 }));
    } catch {
      // Código que el navegador no conoce: número con 2 decimales
      formatos.set(moneda, new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  }
  return formatos.get(moneda)!;
}

/** 1250 → "$1,250.00". Con `conSigno`: "+$1,250.00" / "-$212.00". */
@Pipe({ name: 'moneda' })
export class MonedaPipe implements PipeTransform {
  transform(valor: number | null | undefined, moneda = 'MXN', conSigno = false): string {
    if (valor === null || valor === undefined) return '—';
    const texto = formato(moneda).format(Math.abs(valor));
    if (valor < 0) return `-${texto}`;
    return conSigno && valor > 0 ? `+${texto}` : texto;
  }
}
