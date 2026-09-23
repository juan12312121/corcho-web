import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { InicialesPipe } from '../../pipes/iniciales.pipe';

export interface Persona {
  nombre: string;
  color: string;
  avatarUrl?: string | null;
}

/** Círculo con foto o iniciales sobre el color de la persona; punto verde si está en línea. */
@Component({
  selector: 'app-avatar',
  imports: [InicialesPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="avatar" [style.width.px]="tamano()" [style.height.px]="tamano()" [style.font-size.px]="tamano() * 0.38"
      [style.background]="fondo()" [style.color]="persona().color" [attr.title]="persona().nombre">
      @if (persona().avatarUrl) {
        <img [src]="persona().avatarUrl" [alt]="persona().nombre" />
      } @else {
        <span aria-hidden="true">{{ persona().nombre | iniciales }}</span>
        <span class="solo-lector">{{ persona().nombre }}</span>
      }
      @if (enLinea()) {
        <span class="en-linea" aria-label="en línea"></span>
      }
    </span>
  `,
  styles: `
    :host { display: inline-flex; }
    .avatar {
      position: relative; display: inline-grid; place-items: center; border-radius: 50%;
      font-weight: 900; border: 2px solid var(--superficie); flex-shrink: 0;
    }
    img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
    .en-linea {
      position: absolute; right: -1px; bottom: -1px; width: 30%; height: 30%; min-width: 8px; min-height: 8px;
      border-radius: 50%; background: var(--positivo); border: 2px solid var(--superficie);
    }
  `,
})
export class Avatar {
  readonly persona = input.required<Persona>();
  readonly tamano = input(36);
  readonly enLinea = input(false);

  /** El mismo color de la persona pero muy claro, para que las iniciales se lean. */
  protected readonly fondo = computed(() => `color-mix(in srgb, ${this.persona().color} 22%, white)`);
}
