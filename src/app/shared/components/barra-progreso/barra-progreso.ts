import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Barra de avance (abonos de una deuda, partes liquidadas...). `valor` de 0 a 1. */
@Component({
  selector: 'app-barra-progreso',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pista" role="progressbar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="porcentaje()" [attr.aria-label]="etiqueta()">
      <div class="relleno" [style.width.%]="porcentaje()" [style.background]="color()"></div>
    </div>
  `,
  styles: `
    .pista { height: 6px; border-radius: 99px; background: rgba(0, 0, 0, 0.12); overflow: hidden; }
    .relleno { height: 100%; border-radius: inherit; transition: width 300ms ease; }
  `,
})
export class BarraProgreso {
  readonly valor = input.required<number>();
  readonly color = input('var(--positivo)');
  readonly etiqueta = input('Avance');

  protected readonly porcentaje = computed(() => Math.round(Math.min(1, Math.max(0, this.valor())) * 100));
}
