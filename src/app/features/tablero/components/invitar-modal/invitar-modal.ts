import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Invitacion } from '../../../../core/models';
import { AvisosService } from '../../../../core/services/avisos/avisos.service';
import { mensajeDeError } from '../../../../core/utils/errores';
import { Boton } from '../../../../shared/components/boton/boton';
import { Campo } from '../../../../shared/components/campo/campo';
import { Etiqueta } from '../../../../shared/components/etiqueta/etiqueta';
import { Icono } from '../../../../shared/components/icono/icono';
import { Modal } from '../../../../shared/components/modal/modal';
import { FechaCortaPipe } from '../../../../shared/pipes/fecha-corta.pipe';
import { TableroStore } from '../../tablero.store';

const USOS_ENLACE = 10;

/** Invitar por enlace (para WhatsApp) o por correo; ver y cancelar las pendientes. */
@Component({
  selector: 'app-invitar-modal',
  imports: [ReactiveFormsModule, Modal, Campo, Boton, Etiqueta, Icono, FechaCortaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invitar-modal.html',
  styleUrl: './invitar-modal.scss',
})
export class InvitarModal {
  protected readonly store = inject(TableroStore);
  private readonly avisos = inject(AvisosService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly abierto = input(false);
  readonly cerrar = output<void>();

  protected readonly enlace = signal<Invitacion | null>(null);
  protected readonly ocupado = signal<'enlace' | 'correo' | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly correo = this.fb.control('', [Validators.required, Validators.email]);

  constructor() {
    effect(() => {
      if (!this.abierto()) return;
      this.error.set(null);
      this.correo.reset();
      void this.store.cargarInvitaciones().catch((e) => this.error.set(mensajeDeError(e)));
    });
  }

  protected async crearEnlace(): Promise<void> {
    await this.ejecutar('enlace', async () => {
      this.enlace.set(await this.store.invitar({ usosMax: USOS_ENLACE }));
    });
  }

  protected async invitarPorCorreo(): Promise<void> {
    if (this.correo.invalid) {
      this.correo.markAsTouched();
      this.error.set('Escribe un correo válido');
      return;
    }
    await this.ejecutar('correo', async () => {
      await this.store.invitar({ email: this.correo.value.trim() });
      this.avisos.exito('Invitación enviada; le aparecerá al entrar a Corcho');
      this.correo.reset();
    });
  }

  protected async copiar(invitacion: Invitacion): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.store.enlaceDe(invitacion));
      this.avisos.exito('Enlace copiado');
    } catch {
      this.avisos.error('No se pudo copiar; selecciónalo y cópialo a mano');
    }
  }

  protected whatsapp(invitacion: Invitacion): string {
    const texto = `Te invito a mi tablero "${this.store.tablero()?.nombre}" en Corcho: ${this.store.enlaceDe(invitacion)}`;
    return `https://wa.me/?text=${encodeURIComponent(texto)}`;
  }

  protected async cancelar(invitacion: Invitacion): Promise<void> {
    try {
      await this.store.cancelarInvitacion(invitacion.id);
      if (this.enlace()?.id === invitacion.id) this.enlace.set(null);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    }
  }

  private async ejecutar(tipo: 'enlace' | 'correo', accion: () => Promise<void>): Promise<void> {
    this.ocupado.set(tipo);
    this.error.set(null);
    try {
      await accion();
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.ocupado.set(null);
    }
  }
}
