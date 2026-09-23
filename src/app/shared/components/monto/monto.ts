import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MonedaPipe } from '../../pipes/moneda.pipe';

/**
 * Cantidad de dinero con estilo: grande o normal, y opcionalmente coloreada
 * (verde = me deben / a favor, rojo = debo).
 */
@Component({
  selector: 'app-monto',
  imports: [MonedaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': "'monto tam-' + tamano() + ' ' + tono()" },
  template: `{{ valor() | moneda: moneda() : conSigno() }}@if (mostrarMoneda()) {<small>{{ moneda() }}</small>}`,
  styles: `
    :host { font-weight: 900; font-variant-numeric: tabular-nums; white-space: nowrap; }
    small { font-size: 0.55em; font-weight: 700; margin-left: 4px; opacity: 0.7; }
    :host(.tam-s) { font-size: 14px; }
    :host(.tam-m) { font-size: 18px; }
    :host(.tam-l) { font-size: 26px; }
    :host(.tam-xl) { font-size: 34px; letter-spacing: -0.02em; }
    :host(.positivo) { color: var(--positivo); }
    :host(.negativo) { color: var(--negativo); }
    :host(.tinta) { color: var(--tinta); }
  `,
})
export class Monto {
  readonly valor = input.required<number | null>();
  readonly moneda = input('MXN');
  readonly tamano = input<'s' | 'm' | 'l' | 'xl'>('m');
  readonly colorear = input(false);
  readonly conSigno = input(false);
  readonly mostrarMoneda = input(false);

  protected readonly tono = computed(() => {
    const v = this.valor() ?? 0;
    if (!this.colorear() || v === 0) return 'tinta';
    return v > 0 ? 'positivo' : 'negativo';
  });
}
