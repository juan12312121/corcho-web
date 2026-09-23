import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icono } from '../icono/icono';

export type TonoEtiqueta = 'neutro' | 'exito' | 'peligro' | 'aviso' | 'info' | 'tinta';

/** Pastilla pequeña: "GASTO", "Compartido", "Debe", "Vence en 3 días". */
@Component({
  selector: 'app-etiqueta',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': "'tono-' + tono()", '[class.mayus]': 'mayusculas()' },
  template: `
    @if (icono()) {
      <app-icono [nombre]="icono()!" [tamano]="14" />
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px;
      font-size: 12px; font-weight: 700; white-space: nowrap; line-height: 1.5;
    }
    :host(.mayus) { text-transform: uppercase; letter-spacing: 0.06em; font-size: 10.5px; font-weight: 800; }
    :host(.tono-neutro) { background: rgba(0, 0, 0, 0.07); color: var(--texto-suave); }
    :host(.tono-exito) { background: var(--positivo-fondo); color: #13693a; }
    :host(.tono-peligro) { background: var(--negativo-fondo); color: #a52a2a; }
    :host(.tono-aviso) { background: #fff1c7; color: #7a5200; }
    :host(.tono-info) { background: var(--tinta-clara); color: var(--tinta); }
    :host(.tono-tinta) { background: var(--tinta); color: #fff; }
  `,
})
export class Etiqueta {
  readonly tono = input<TonoEtiqueta>('neutro');
  readonly icono = input<string>();
  readonly mayusculas = input(false);
}
