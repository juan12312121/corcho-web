import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { InvitacionPendiente } from '../../core/models';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { InvitacionesService } from '../../core/services/invitaciones/invitaciones.service';
import { TiempoRealService } from '../../core/services/tiempo-real/tiempo-real.service';
import { mensajeDeError } from '../../core/utils/errores';
import { Boton } from '../../shared/components/boton/boton';
import { Icono } from '../../shared/components/icono/icono';

/** Campana con las invitaciones que me llegaron por correo; se actualiza en vivo. */
@Component({
  selector: 'app-bandeja-invitaciones',
  imports: [Icono, Boton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'abierta.set(false)' },
  templateUrl: './bandeja-invitaciones.html',
  styleUrl: './bandeja-invitaciones.scss',
})
export class BandejaInvitaciones implements OnInit {
  private readonly invitaciones = inject(InvitacionesService);
  private readonly tiempoReal = inject(TiempoRealService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pendientes = signal<InvitacionPendiente[]>([]);
  protected readonly abierta = signal(false);
  protected readonly procesando = signal<string | null>(null);

  ngOnInit(): void {
    void this.cargar();
    this.tiempoReal
      .escuchar('invitacion:nueva')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ tablero }) => {
        this.avisos.info(`Te invitaron a "${tablero}"`);
        void this.cargar();
      });
  }

  protected async aceptar(invitacion: InvitacionPendiente): Promise<void> {
    await this.procesar(invitacion, async () => {
      const { tableroId } = await this.invitaciones.aceptar(invitacion.codigo);
      this.abierta.set(false);
      this.avisos.exito(`Ya estás en "${invitacion.tablero}"`);
      await this.router.navigate(['/tableros', tableroId]);
    });
  }

  protected async rechazar(invitacion: InvitacionPendiente): Promise<void> {
    await this.procesar(invitacion, () => this.invitaciones.rechazar(invitacion.codigo));
  }

  private async procesar(invitacion: InvitacionPendiente, accion: () => Promise<unknown>): Promise<void> {
    this.procesando.set(invitacion.id);
    try {
      await accion();
      this.pendientes.update((lista) => lista.filter((i) => i.id !== invitacion.id));
    } catch (e) {
      this.avisos.error(mensajeDeError(e));
    } finally {
      this.procesando.set(null);
    }
  }

  private async cargar(): Promise<void> {
    try {
      this.pendientes.set(await this.invitaciones.pendientes());
    } catch {
      /* la campana no es crítica: si falla, se queda vacía */
    }
  }
}
