import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MonedaPipe } from '../../pipes/moneda.pipe';
import { Segmento } from './grafica-barras';

/** Circunferencia de 100 para que los porcentajes sean directamente la longitud del trazo. */
const RADIO = 15.9155;

/** Dona en SVG con leyenda: en qué se fue el dinero. */
@Component({
  selector: 'app-grafica-dona',
  imports: [MonedaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dona">
      <svg viewBox="0 0 42 42" role="img" [attr.aria-label]="etiqueta()">
        <circle class="fondo" cx="21" cy="21" [attr.r]="radio" />
        @for (a of arcos(); track a.nombre) {
          <circle cx="21" cy="21" [attr.r]="radio" [attr.stroke]="a.color" [attr.stroke-dasharray]="a.largo + ' ' + (100 - a.largo)"
            [attr.stroke-dashoffset]="a.desfase">
            <title>{{ a.nombre }}: {{ a.valor | moneda: moneda() }} ({{ a.porcentaje }} %)</title>
          </circle>
        }
      </svg>
      <div class="centro">
        <small>Total</small>
        <strong>{{ total() | moneda: moneda() }}</strong>
      </div>
    </div>
    <ul class="leyenda">
      @for (a of arcos(); track a.nombre) {
        <li>
          <span class="punto" [style.background]="a.color"></span>
          <span class="nombre">{{ a.nombre }}</span>
          <span class="pct">{{ a.porcentaje }} %</span>
          <strong>{{ a.valor | moneda: moneda() }}</strong>
        </li>
      }
    </ul>
  `,
  styles: `
    :host { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
    .dona { position: relative; width: 190px; flex: none; }
    svg { width: 100%; transform: rotate(-90deg); }
    circle { fill: none; stroke-width: 6; transition: opacity 160ms ease; }
    circle:hover { opacity: 0.8; }
    .fondo { stroke: var(--superficie-media); }
    .centro { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
    .centro small { font-size: 12px; color: var(--texto-tenue); }
    .centro strong { font-size: 16px; color: var(--tinta-oscura); }
    .leyenda { flex: 1; min-width: 200px; list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .leyenda li { display: flex; align-items: center; gap: 8px; font-size: 14px; }
    .punto { width: 12px; height: 12px; border-radius: 4px; flex: none; }
    .nombre { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pct { color: var(--texto-tenue); font-size: 13px; }
  `,
})
export class GraficaDona {
  readonly porciones = input.required<Segmento[]>();
  readonly moneda = input('MXN');
  readonly etiqueta = input('Gráfica de dona');

  protected readonly radio = RADIO;
  protected readonly total = computed(() => this.porciones().reduce((t, p) => t + p.valor, 0));

  protected readonly arcos = computed(() => {
    const total = this.total() || 1;
    let acumulado = 0;
    return this.porciones()
      .filter((p) => p.valor > 0)
      .map((p) => {
        const largo = (p.valor / total) * 100;
        const arco = { ...p, largo, desfase: -acumulado, porcentaje: Math.round(largo) };
        acumulado += largo;
        return arco;
      });
  });
}
