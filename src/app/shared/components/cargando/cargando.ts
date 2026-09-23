import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Indicador de carga: tres chinches saltando. */
@Component({
  selector: 'app-cargando',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="puntos" role="status" [attr.aria-label]="texto()">
      <span></span><span></span><span></span>
    </div>
    @if (texto()) {
      <p>{{ texto() }}</p>
    }
  `,
  styles: `
    :host { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; color: var(--texto-tenue); }
    .puntos { display: flex; gap: 8px; }
    span { width: 12px; height: 12px; border-radius: 50%; background: var(--pin-rojo); box-shadow: var(--sombra-pin); animation: saltar 0.9s ease-in-out infinite; }
    span:nth-child(2) { background: var(--pin-azul); animation-delay: 0.15s; }
    span:nth-child(3) { background: var(--pin-amarillo); animation-delay: 0.3s; }
    @keyframes saltar { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-8px); } }
  `,
})
export class Cargando {
  readonly texto = input('Cargando…');
}
