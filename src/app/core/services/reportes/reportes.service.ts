import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Reporte } from '../../models';

/** Gastos por mes, categoría y persona (lo pagado; lo pendiente no cuenta). */
@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly api = inject(ApiService);

  obtener(tableroId: string, meses: number): Promise<Reporte> {
    return this.api.get(`/tableros/${tableroId}/reportes`, { params: { meses } });
  }
}
