import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icono } from '../icono/icono';

/** Cuando no hay nada que mostrar: ícono, mensaje y (opcional) acciones proyectadas. */
@Component({
  selector: 'app-estado-vacio',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="icono-caja"><app-icono [nombre]="icono()" [tamano]="30" /></span>
    <h3>{{ titulo() }}</h3>
    @if (texto()) {
      <p>{{ texto() }}</p>
    }
    <div class="acciones"><ng-content /></div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 32px 16px; }
    .icono-caja { display: grid; place-items: center; width: 60px; height: 60px; border-radius: 18px; background: var(--madera-clara); color: var(--tinta-oscura); margin-bottom: 6px; }
    h3 { font-size: 18px; }
    p { color: var(--texto-tenue); max-width: 38ch; }
    .acciones { display: flex; gap: 8px; margin-top: 8px; }
    .acciones:empty { display: none; }
  `,
})
export class EstadoVacio {
  readonly icono = input('push_pin');
  readonly titulo = input.required<string>();
  readonly texto = input<string>();
}
