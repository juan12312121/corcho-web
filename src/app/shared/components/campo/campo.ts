import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Etiqueta + control + ayuda/error, con el estilo común de los inputs.
 *   <app-campo etiqueta="Monto" [error]="errores.monto()">
 *     <input formControlName="monto" type="number" />
 *   </app-campo>
 */
@Component({
  selector: 'app-campo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label>
      <span class="etiqueta">{{ etiqueta() }} @if (opcional()) {<small>(opcional)</small>}</span>
      <ng-content />
    </label>
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    } @else if (ayuda()) {
      <p class="ayuda">{{ ayuda() }}</p>
    }
  `,
  styleUrl: './campo.scss',
})
export class Campo {
  readonly etiqueta = input.required<string>();
  readonly ayuda = input<string>();
  readonly error = input<string | null>();
  readonly opcional = input(false);
}
