import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { DatosPago, EstadoPago, Pago } from '../../models';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly api = inject(ApiService);

  listar(tableroId: string, estado?: EstadoPago): Promise<Pago[]> {
    return this.api.get(`/tableros/${tableroId}/pagos`, { params: { estado, porPagina: 100 } });
  }

  registrar(tableroId: string, datos: DatosPago): Promise<Pago> {
    return this.api.post(`/tableros/${tableroId}/pagos`, datos);
  }

  confirmar(tableroId: string, pagoId: string): Promise<Pago> {
    return this.api.post(`/tableros/${tableroId}/pagos/${pagoId}/confirmar`);
  }

  rechazar(tableroId: string, pagoId: string): Promise<Pago> {
    return this.api.post(`/tableros/${tableroId}/pagos/${pagoId}/rechazar`);
  }

  anular(tableroId: string, pagoId: string): Promise<void> {
    return this.api.delete(`/tableros/${tableroId}/pagos/${pagoId}`);
  }
}
