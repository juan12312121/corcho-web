import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { DatosInvitacion, Invitacion, InvitacionPendiente, VistaInvitacion } from '../../models';

@Injectable({ providedIn: 'root' })
export class InvitacionesService {
  private readonly api = inject(ApiService);

  listar(tableroId: string): Promise<Invitacion[]> {
    return this.api.get(`/tableros/${tableroId}/invitaciones`);
  }

  crear(tableroId: string, datos: DatosInvitacion): Promise<Invitacion> {
    return this.api.post(`/tableros/${tableroId}/invitaciones`, datos);
  }

  cancelar(tableroId: string, invitacionId: string): Promise<void> {
    return this.api.delete(`/tableros/${tableroId}/invitaciones/${invitacionId}`);
  }

  pendientes(): Promise<InvitacionPendiente[]> {
    return this.api.get('/invitaciones/pendientes');
  }

  ver(codigo: string): Promise<VistaInvitacion> {
    return this.api.get(`/invitaciones/${codigo}`);
  }

  aceptar(codigo: string): Promise<{ tableroId: string; yaEraMiembro: boolean }> {
    return this.api.post(`/invitaciones/${codigo}/aceptar`);
  }

  rechazar(codigo: string): Promise<void> {
    return this.api.post(`/invitaciones/${codigo}/rechazar`);
  }

  /** Enlace para compartir (por WhatsApp, por ejemplo). */
  enlace(codigo: string): string {
    return `${location.origin}/invitacion/${codigo}`;
  }
}
