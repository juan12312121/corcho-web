import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Ícono de Material Symbols: <app-icono nombre="push_pin" />. Decorativo salvo que se le dé etiqueta. */
@Component({
  selector: 'app-icono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="icono" [style.font-size.px]="tamano()" [class.relleno]="relleno()" [attr.aria-hidden]="!etiqueta()"
    [attr.aria-label]="etiqueta() || null" [attr.role]="etiqueta() ? 'img' : null">{{ nombre() }}</span>`,
  styles: `
    :host { display: inline-flex; line-height: 0; }
    .relleno { font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24; }
  `,
})
export class Icono {
  readonly nombre = input.required<string>();
  readonly tamano = input(20);
  readonly relleno = input(false);
  readonly etiqueta = input<string>();
}
