import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { DatosIngreso, Ingreso } from '../../models';

/** Ingresos del tablero personal (flujo del mes). */
@Injectable({ providedIn: 'root' })
export class IngresosService {
  private readonly api = inject(ApiService);

  listar(tableroId: string): Promise<Ingreso[]> {
    return this.api.get(this.ruta(tableroId));
  }

  crear(tableroId: string, datos: DatosIngreso): Promise<Ingreso> {
    return this.api.post(this.ruta(tableroId), datos);
  }

  borrar(tableroId: string, ingresoId: string): Promise<void> {
    return this.api.delete(`${this.ruta(tableroId)}/${ingresoId}`);
  }

  private ruta(tableroId: string): string {
    return `/tableros/${tableroId}/ingresos`;
  }
}
