import { Pipe, PipeTransform } from '@angular/core';
import { textoVencimiento } from '../../core/utils/fechas';

/** '2026-09-26' → "Vence en 3 días" / "Vencida hace 2 días". */
@Pipe({ name: 'vencimiento' })
export class VencimientoPipe implements PipeTransform {
  transform(fecha: string | null | undefined): string {
    return fecha ? textoVencimiento(fecha) : '';
  }
}
