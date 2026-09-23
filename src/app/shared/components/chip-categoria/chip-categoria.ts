import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icono } from '../icono/icono';

export interface CategoriaVisible {
  nombre: string;
  icono: string;
  color: string;
}

/** Pastilla de categoría con su ícono y color: 🛒 Súper. */
@Component({
  selector: 'app-chip-categoria',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.--color]': 'categoria().color', '[class.chico]': 'chico()' },
  template: `<app-icono [nombre]="categoria().icono" [tamano]="chico() ? 13 : 16" /><span>{{ categoria().nombre }}</span>`,
  styles: `
    :host {
      display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px 2px 6px; border-radius: 99px; max-width: 100%;
      background: color-mix(in srgb, var(--color) 16%, white); color: color-mix(in srgb, var(--color) 80%, black);
      font-size: 12px; font-weight: 800; white-space: nowrap;
    }
    :host(.chico) { font-size: 11px; padding: 1px 7px 1px 5px; }
    span { overflow: hidden; text-overflow: ellipsis; }
  `,
})
export class ChipCategoria {
  readonly categoria = input.required<CategoriaVisible>();
  readonly chico = input(false);
}
