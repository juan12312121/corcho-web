import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Avatar, Persona } from '../avatar/avatar';

type PersonaConId = Persona & { usuarioId: string };

/** Avatares encimados ("AN BE CA +2"), marcando quién está en línea. */
@Component({
  selector: 'app-grupo-avatares',
  imports: [Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grupo" [attr.aria-label]="personas().length + ' personas'">
      @for (p of visibles(); track p.usuarioId) {
        <app-avatar [persona]="p" [tamano]="tamano()" [enLinea]="presentes().includes(p.usuarioId)" />
      }
      @if (resto() > 0) {
        <span class="resto" [style.width.px]="tamano()" [style.height.px]="tamano()">+{{ resto() }}</span>
      }
    </div>
  `,
  styles: `
    .grupo { display: flex; align-items: center; }
    .grupo > * + * { margin-left: -8px; }
    .resto {
      display: inline-grid; place-items: center; border-radius: 50%; font-size: 12px; font-weight: 800;
      background: var(--superficie-media); color: var(--texto-suave); border: 2px solid var(--superficie);
    }
  `,
})
export class GrupoAvatares {
  readonly personas = input.required<PersonaConId[]>();
  readonly presentes = input<string[]>([]);
  readonly maximo = input(4);
  readonly tamano = input(30);

  protected readonly visibles = computed(() => this.personas().slice(0, this.maximo()));
  protected readonly resto = computed(() => this.personas().length - this.visibles().length);
}
