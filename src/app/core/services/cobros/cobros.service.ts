import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { EstadoCobros, Pago, PagoConTarjeta } from '../../models';

/**
 * Pagos con tarjeta (Stripe Connect): conectar mi cuenta para cobrar y pagarle a
 * otro miembro. El dinero va directo a la cuenta de quien cobra.
 */
@Injectable({ providedIn: 'root' })
export class CobrosService {
  private readonly api = inject(ApiService);

  estado(): Promise<EstadoCobros> {
    return this.api.get('/auth/yo/cobros');
  }

  /** Enlace de Stripe donde la persona da sus datos y su cuenta bancaria. */
  async conectar(): Promise<string> {
    return (await this.api.post<{ url: string }>('/auth/yo/cobros')).url;
  }

  /** Crea la página de pago de Stripe; hay que mandar al navegador a `url`. */
  pagar(tableroId: string, datos: { aUsuarioId: string; monto: number; notaId?: string; concepto?: string }): Promise<PagoConTarjeta> {
    return this.api.post(`/tableros/${tableroId}/pagos/tarjeta`, datos);
  }

  /** Al regresar de Stripe: registra el pago si ya se cobró (por si el webhook tarda). */
  verificar(tableroId: string, sesion: string): Promise<{ pagado: boolean; pago: Pago | null }> {
    return this.api.post(`/tableros/${tableroId}/pagos/tarjeta/${encodeURIComponent(sesion)}/verificar`);
  }
}
