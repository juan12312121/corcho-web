import { Pipe, PipeTransform } from '@angular/core';

const formato = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** '2026-09-14' → "14 sep" (fechas de calendario, sin corrimiento por zona horaria). */
@Pipe({ name: 'fechaCorta' })
export class FechaCortaPipe implements PipeTransform {
  transform(fecha: string | null | undefined): string {
    if (!fecha) return '';
    return formato.format(new Date(`${fecha.slice(0, 10)}T00:00:00Z`)).replace('.', '');
  }
}
