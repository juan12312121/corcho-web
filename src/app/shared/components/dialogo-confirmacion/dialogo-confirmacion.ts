import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { mensajeDeError } from '../../../core/utils/errores';
import { Boton, VarianteBoton } from '../boton/boton';
import { Modal } from '../modal/modal';

/** Pregunta de sí/no antes de algo delicado. Ejecuta `accion` y muestra su error si falla. */
@Component({
  selector: 'app-dialogo-confirmacion',
  imports: [Modal, Boton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [abierto]="abierto()" [titulo]="titulo()" [icono]="icono()" ancho="s" (cerrar)="cerrar.emit()">
      <p class="mensaje">{{ mensaje() }}</p>
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      <ng-container pie>
        <button appBoton variante="fantasma" (click)="cerrar.emit()">Cancelar</button>
        <button appBoton [variante]="variante()" [cargando]="ocupado()" (click)="confirmar()">{{ textoConfirmar() }}</button>
      </ng-container>
    </app-modal>
  `,
  styles: `
    .mensaje { color: var(--texto-suave); }
    .error { margin-top: 12px; }
  `,
})
export class DialogoConfirmacion {
  readonly abierto = input(false);
  readonly titulo = input.required<string>();
  readonly mensaje = input.required<string>();
  readonly textoConfirmar = input('Confirmar');
  readonly variante = input<VarianteBoton>('primario');
  readonly icono = input('help');
  readonly accion = input.required<() => Promise<unknown>>();
  readonly cerrar = output<void>();

  protected readonly ocupado = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.abierto()) this.error.set(null);
    });
  }

  protected async confirmar(): Promise<void> {
    this.ocupado.set(true);
    this.error.set(null);
    try {
      await this.accion()();
      this.cerrar.emit();
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.ocupado.set(false);
    }
  }
}
