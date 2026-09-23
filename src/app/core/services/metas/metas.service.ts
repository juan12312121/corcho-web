import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { DatosMeta, Meta } from '../../models';

/** Metas de ahorro y sus aportes (un monto negativo es un retiro). */
@Injectable({ providedIn: 'root' })
export class MetasService {
  private readonly api = inject(ApiService);

  listar(tableroId: string): Promise<Meta[]> {
    return this.api.get(this.ruta(tableroId));
  }

  crear(tableroId: string, datos: DatosMeta): Promise<Meta> {
    return this.api.post(this.ruta(tableroId), datos);
  }

  aportar(tableroId: string, metaId: string, monto: number): Promise<Meta> {
    return this.api.post(`${this.ruta(tableroId)}/${metaId}/aportes`, { monto });
  }

  borrar(tableroId: string, metaId: string): Promise<void> {
    return this.api.delete(`${this.ruta(tableroId)}/${metaId}`);
  }

  private ruta(tableroId: string): string {
    return `/tableros/${tableroId}/metas`;
  }
}
