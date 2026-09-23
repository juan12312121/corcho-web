import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { Icono } from '../icono/icono';

let siguienteId = 0;

/**
 * Ventana modal sobre el <dialog> nativo (foco atrapado, Esc y lector de pantalla gratis).
 *
 *   <app-modal [abierto]="abierto()" titulo="Nueva nota" (cerrar)="abierto.set(false)">
 *     ...contenido...
 *     <ng-container pie> botones </ng-container>
 *   </app-modal>
 */
@Component({
  selector: 'app-modal',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  readonly abierto = input(false);
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
  readonly icono = input<string>();
  readonly ancho = input<'s' | 'm' | 'l'>('m');
  readonly cerrar = output<void>();

  protected readonly idTitulo = `modal-titulo-${++siguienteId}`;
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const dialogo = this.dialogo().nativeElement;
      if (this.abierto() && !dialogo.open) dialogo.showModal();
      if (!this.abierto() && dialogo.open) dialogo.close();
    });
  }

  /** Esc o botón cerrar: se avisa al padre, que es quien decide cerrar. */
  protected pedirCierre(evento?: Event): void {
    evento?.preventDefault();
    if (this.abierto()) this.cerrar.emit();
  }

  /** Clic en el fondo oscuro (fuera de la caja). */
  protected clicEnFondo(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) this.pedirCierre();
  }
}
