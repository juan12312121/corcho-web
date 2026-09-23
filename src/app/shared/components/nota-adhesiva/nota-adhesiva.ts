import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ColorNota } from '../../../core/models';
import { Chinche } from '../chinche/chinche';

/**
 * El post-it: papel de color, ligeramente girado, con su chinche.
 * Solo dibuja; el contenido se proyecta. Se usa en el corcho, en vistas previas y en la landing.
 */
@Component({
  selector: 'app-nota-adhesiva',
  imports: [Chinche],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--papel]': "'var(--nota-' + color() + ')'",
    '[style.--giro]': "rotacion() + 'deg'",
    '[class.levantada]': 'levantada()',
    '[class.atenuada]': 'atenuada()',
    '[class.compacta]': 'compacta()',
  },
  template: `
    <app-chinche class="pin" [color]="pinColor()" />
    <ng-content />
  `,
  styles: `
    :host {
      position: relative; display: flex; flex-direction: column; gap: 6px;
      padding: 22px 16px 14px; border-radius: 3px 3px 10px 3px;
      background: linear-gradient(170deg, color-mix(in srgb, var(--papel) 88%, white) 0%, var(--papel) 45%);
      box-shadow: var(--sombra-m); transform: rotate(var(--giro));
      transition: box-shadow var(--transicion), transform var(--transicion), opacity var(--transicion);
      color: #2b2620;
    }
    :host(.compacta) { padding: 14px 10px 8px; gap: 2px; font-size: 11px; }
    :host(.levantada) { box-shadow: var(--sombra-l); transform: rotate(var(--giro)) scale(1.03); }
    :host(.atenuada) { opacity: 0.62; filter: grayscale(0.55); }
    .pin { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); }
  `,
})
export class NotaAdhesiva {
  readonly color = input<ColorNota>('amarillo');
  readonly pinColor = input('rojo');
  readonly rotacion = input(0);
  readonly levantada = input(false);
  readonly atenuada = input(false);
  readonly compacta = input(false);
}
