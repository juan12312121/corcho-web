import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { VistaInvitacion } from '../../core/models';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { InvitacionesService } from '../../core/services/invitaciones/invitaciones.service';
import { mensajeDeError } from '../../core/utils/errores';
import { Boton } from '../../shared/components/boton/boton';
import { Cargando } from '../../shared/components/cargando/cargando';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';
import { Icono } from '../../shared/components/icono/icono';
import { Marca } from '../../shared/components/marca/marca';
import { NotaAdhesiva } from '../../shared/components/nota-adhesiva/nota-adhesiva';
import { FechaCortaPipe } from '../../shared/pipes/fecha-corta.pipe';

/** /invitacion/:codigo — a dónde llega el enlace compartido. El sesionGuard pide entrar primero. */
@Component({
  selector: 'app-aceptar-invitacion-page',
  imports: [RouterLink, Boton, Cargando, EstadoVacio, Icono, Marca, NotaAdhesiva, FechaCortaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aceptar-invitacion-page.html',
  styleUrl: './aceptar-invitacion-page.scss',
})
export class AceptarInvitacionPage {
  private readonly invitaciones = inject(InvitacionesService);
  private readonly router = inject(Router);
  private readonly avisos = inject(AvisosService);

  readonly codigo = input.required<string>();

  protected readonly vista = signal<VistaInvitacion | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aceptando = signal(false);

  constructor() {
    effect(() => {
      const codigo = this.codigo();
      untracked(() => void this.cargar(codigo));
    });
  }

  protected async aceptar(): Promise<void> {
    this.aceptando.set(true);
    try {
      const { tableroId, yaEraMiembro } = await this.invitaciones.aceptar(this.codigo());
      this.avisos.exito(yaEraMiembro ? 'Ya estabas en este tablero' : `¡Bienvenido a "${this.vista()?.tablero}"!`);
      await this.router.navigate(['/tableros', tableroId]);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.aceptando.set(false);
    }
  }

  private async cargar(codigo: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.vista.set(await this.invitaciones.ver(codigo));
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
