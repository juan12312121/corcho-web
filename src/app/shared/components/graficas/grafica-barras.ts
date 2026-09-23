import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MonedaPipe } from '../../pipes/moneda.pipe';

export interface Segmento {
  nombre: string;
  valor: number;
  color: string;
}

export interface Columna {
  etiqueta: string;
  segmentos: Segmento[];
}

const ANCHO = 640;
const ALTO = 260;
const MARGEN = { arriba: 24, abajo: 30, izquierda: 8, derecha: 8 };
const LINEAS_GUIA = 4;

/** Barras apiladas en SVG (sin librerías): una columna por mes, un color por categoría. */
@Component({
  selector: 'app-grafica-barras',
  imports: [MonedaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + ancho + ' ' + alto" role="img" [attr.aria-label]="etiqueta()" preserveAspectRatio="xMidYMid meet">
      @for (g of guias(); track g.y) {
        <line class="guia" [attr.x1]="margen.izquierda" [attr.x2]="ancho - margen.derecha" [attr.y1]="g.y" [attr.y2]="g.y" />
      }
      @for (b of barras(); track b.etiqueta) {
        @for (s of b.rectangulos; track s.nombre) {
          <rect [attr.x]="b.x" [attr.y]="s.y" [attr.width]="b.ancho" [attr.height]="s.alto" [attr.fill]="s.color" rx="3">
            <title>{{ b.etiqueta }} · {{ s.nombre }}: {{ s.valor | moneda: moneda() }}</title>
          </rect>
        }
        @if (b.total > 0) {
          <text class="total" [attr.x]="b.x + b.ancho / 2" [attr.y]="b.yTotal - 6">{{ b.totalCorto }}</text>
        }
        <text class="mes" [attr.x]="b.x + b.ancho / 2" [attr.y]="alto - 8">{{ b.etiqueta }}</text>
      }
    </svg>
  `,
  styles: `
    :host { display: block; }
    svg { width: 100%; height: auto; overflow: visible; }
    .guia { stroke: var(--borde); stroke-dasharray: 3 4; }
    text { font-family: var(--fuente); text-anchor: middle; }
    .total { font-size: 12px; font-weight: 800; fill: var(--texto); }
    .mes { font-size: 12px; font-weight: 700; fill: var(--texto-tenue); text-transform: capitalize; }
    rect { transition: opacity 160ms ease; }
    rect:hover { opacity: 0.8; }
  `,
})
export class GraficaBarras {
  readonly columnas = input.required<Columna[]>();
  readonly moneda = input('MXN');
  readonly etiqueta = input('Gráfica de barras');

  protected readonly ancho = ANCHO;
  protected readonly alto = ALTO;
  protected readonly margen = MARGEN;

  private readonly maximo = computed(() => Math.max(1, ...this.columnas().map((c) => c.segmentos.reduce((t, s) => t + s.valor, 0))));
  private readonly altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;

  protected readonly guias = computed(() =>
    Array.from({ length: LINEAS_GUIA + 1 }, (_, i) => ({ y: MARGEN.arriba + (this.altoUtil * i) / LINEAS_GUIA })),
  );

  protected readonly barras = computed(() => {
    const columnas = this.columnas();
    const hueco = (ANCHO - MARGEN.izquierda - MARGEN.derecha) / Math.max(1, columnas.length);
    const anchoBarra = Math.min(56, hueco * 0.6);
    const base = ALTO - MARGEN.abajo;
    return columnas.map((c, i) => {
      let y = base;
      const rectangulos = c.segmentos
        .filter((s) => s.valor > 0)
        .map((s) => {
          const alto = (s.valor / this.maximo()) * this.altoUtil;
          y -= alto;
          return { ...s, y, alto };
        });
      const total = c.segmentos.reduce((t, s) => t + s.valor, 0);
      return {
        etiqueta: c.etiqueta,
        x: MARGEN.izquierda + hueco * i + (hueco - anchoBarra) / 2,
        ancho: anchoBarra,
        rectangulos,
        total,
        totalCorto: abreviar(total),
        yTotal: y,
      };
    });
  });
}

/** 12500 → "12.5k" para que quepa arriba de la barra. */
function abreviar(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(Math.round(n));
}
