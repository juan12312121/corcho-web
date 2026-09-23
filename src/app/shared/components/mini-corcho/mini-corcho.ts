import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ColorNota } from '../../../core/models';
import { NotaAdhesiva } from '../nota-adhesiva/nota-adhesiva';

export interface NotaMiniatura {
  titulo: string;
  detalle?: string;
  color: ColorNota;
  pinColor?: string;
  rotacion?: number;
}

/** Pedacito de corcho con 2–3 notas de muestra (tarjetas de tableros, landing). */
@Component({
  selector: 'app-mini-corcho',
  imports: [NotaAdhesiva],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="corcho textura-corcho" [style.min-height.px]="alto()">
      @for (nota of notas(); track $index) {
        <app-nota-adhesiva [color]="nota.color" [pinColor]="nota.pinColor ?? 'rojo'" [rotacion]="nota.rotacion ?? ($even ? -3 : 3)" [compacta]="true">
          <strong class="mano">{{ nota.titulo }}</strong>
          @if (nota.detalle) {
            <small>{{ nota.detalle }}</small>
          }
        </app-nota-adhesiva>
      } @empty {
        <p class="vacio">Corcho vacío</p>
      }
    </div>
  `,
  styles: `
    .corcho {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; align-items: start; padding: 16px 12px 12px;
      border-radius: var(--radio-m); box-shadow: inset 0 3px 12px rgba(43, 35, 32, 0.28);
    }
    strong { font-size: 16px; line-height: 1.1; overflow-wrap: anywhere; }
    small { font-weight: 700; opacity: 0.75; }
    .vacio { grid-column: 1 / -1; align-self: center; text-align: center; color: rgba(255, 255, 255, 0.85); font-weight: 800; }
  `,
})
export class MiniCorcho {
  readonly notas = input.required<NotaMiniatura[]>();
  readonly alto = input(120);
}
