export type EstadoPago = 'pendiente' | 'confirmado' | 'rechazado';
export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';

export interface Pago {
  id: string;
  tableroId: string;
  deUsuarioId: string;
  aUsuarioId: string;
  monto: number;
  notaId: string | null;
  concepto: string | null;
  metodo: MetodoPago;
  estado: EstadoPago;
  registradoPor: string;
  fecha: string;
  creadoEn: string;
}

export interface DatosPago {
  deUsuarioId?: string;
  aUsuarioId: string;
  monto: number;
  notaId?: string;
  concepto?: string | null;
  metodo?: MetodoPago;
}
