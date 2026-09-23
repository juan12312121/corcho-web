import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Actividad } from '../../models';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly api = inject(ApiService);

  recientes(tableroId: string, cuantas = 20): Promise<Actividad[]> {
    return this.api.get(`/tableros/${tableroId}/actividad`, { params: { porPagina: cuantas } });
  }
}
