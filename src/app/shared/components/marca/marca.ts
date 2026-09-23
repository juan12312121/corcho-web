import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../icono/icono';

/** Logotipo "Corcho" con su chinche. */
@Component({
  selector: 'app-marca',
  imports: [Icono, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a [routerLink]="destino()" class="marca" aria-label="Corcho, inicio">
      <span class="logo"><app-icono nombre="push_pin" [relleno]="true" [tamano]="20" /></span>
      <span class="nombre">Corcho</span>
    </a>
  `,
  styles: `
    .marca { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--tinta-oscura); }
    .logo { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; background: var(--madera-clara); color: var(--pin-rojo); transform: rotate(-8deg); }
    .nombre { font-size: 22px; font-weight: 900; letter-spacing: -0.02em; }
  `,
})
export class Marca {
  readonly destino = input('/');
}
