import { Pipe, PipeTransform } from '@angular/core';

/** "Ana García" → "AG"; "beto" → "BE". */
@Pipe({ name: 'iniciales' })
export class InicialesPipe implements PipeTransform {
  transform(nombre: string | null | undefined): string {
    const palabras = (nombre ?? '').trim().split(/\s+/).filter(Boolean);
    if (!palabras.length) return '?';
    if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  }
}
