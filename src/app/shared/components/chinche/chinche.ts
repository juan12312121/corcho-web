import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export const COLORES_CHINCHE = ['rojo', 'azul', 'verde', 'amarillo', 'morado', 'naranja'] as const;
export type ColorChinche = (typeof COLORES_CHINCHE)[number];

/** La chinche (push pin) que clava cada nota al corcho. */
@Component({
  selector: 'app-chinche',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="chinche" [style.--color]="'var(--pin-' + color() + ', var(--pin-rojo))'" aria-hidden="true"></span>`,
  styles: `
    :host { display: inline-flex; }
    .chinche {
      width: 16px; height: 16px; border-radius: 50%; position: relative;
      background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--color) 55%, white) 0 18%, var(--color) 45%);
      box-shadow: var(--sombra-pin);
    }
    .chinche::after {
      content: ''; position: absolute; left: 50%; top: 100%; width: 2px; height: 5px; transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.25); border-radius: 1px;
    }
  `,
})
export class Chinche {
  readonly color = input<string>('rojo');
}
