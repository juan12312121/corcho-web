import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Miembro, Rol } from '../../models';

@Injectable({ providedIn: 'root' })
export class MiembrosService {
  private readonly api = inject(ApiService);

  listar(tableroId: string): Promise<Miembro[]> {
    return this.api.get(`/tableros/${tableroId}/miembros`);
  }

  cambiarRol(tableroId: string, usuarioId: string, rol: Exclude<Rol, 'propietario'>): Promise<Miembro> {
    return this.api.patch(`/tableros/${tableroId}/miembros/${usuarioId}`, { rol });
  }

  sacar(tableroId: string, usuarioId: string): Promise<void> {
    return this.api.delete(`/tableros/${tableroId}/miembros/${usuarioId}`);
  }

  salir(tableroId: string): Promise<void> {
    return this.api.post(`/tableros/${tableroId}/miembros/salir`);
  }
}
