import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icono } from '../icono/icono';

export type VarianteBoton = 'primario' | 'secundario' | 'fantasma' | 'peligro' | 'exito' | 'calido';
export type TamanoBoton = 's' | 'm' | 'l';

/**
 * Botón de la app sobre el <button>/<a> nativo (se conserva toda su semántica):
 *   <button appBoton variante="primario" icono="add" [cargando]="guardando()">Crear</button>
 */
@Component({
  selector: 'button[appBoton], a[appBoton]',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "'boton boton--' + variante() + ' boton--' + tamano()",
    '[class.boton--bloque]': 'bloque()',
    '[class.boton--cargando]': 'cargando()',
    '[attr.aria-busy]': 'cargando() || null',
  },
  template: `
    @if (cargando()) {
      <span class="giro" aria-hidden="true"></span>
    } @else if (icono()) {
      <app-icono [nombre]="icono()!" [tamano]="tamano() === 's' ? 16 : 20" />
    }
    <span class="texto"><ng-content /></span>
  `,
  styleUrl: './boton.scss',
})
export class Boton {
  readonly variante = input<VarianteBoton>('secundario');
  readonly tamano = input<TamanoBoton>('m');
  readonly icono = input<string>();
  readonly cargando = input(false);
  readonly bloque = input(false);
}
