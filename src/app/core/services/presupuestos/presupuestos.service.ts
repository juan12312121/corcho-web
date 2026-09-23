import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

export interface Presupuesto {
  id: string;
  tableroId: string;
  categoriaId: string;
  montoMensual: number;
}

/** Tope mensual por categoría (el avance del mes viene calculado en el balance). */
@Injectable({ providedIn: 'root' })
export class PresupuestosService {
  private readonly api = inject(ApiService);

  /** Crea o cambia el tope de la categoría (uno por categoría). */
  guardar(tableroId: string, categoriaId: string, montoMensual: number): Promise<Presupuesto> {
    return this.api.put(this.ruta(tableroId), { categoriaId, montoMensual });
  }

  borrar(tableroId: string, presupuestoId: string): Promise<void> {
    return this.api.delete(`${this.ruta(tableroId)}/${presupuestoId}`);
  }

  private ruta(tableroId: string): string {
    return `/tableros/${tableroId}/presupuestos`;
  }
}
