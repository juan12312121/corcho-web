export type TipoNota = 'gasto' | 'servicio' | 'prestamo' | 'recordatorio';
export type EstadoNota = 'por_pagar' | 'pagada' | 'liquidada';
export type ColorNota = 'amarillo' | 'azul' | 'verde' | 'rosa' | 'naranja' | 'morado';
export type ModoReparto = 'igual' | 'montos' | 'porcentaje' | 'proporcion';
export type Recurrencia = 'ninguna' | 'semanal' | 'quincenal' | 'mensual';
export type Direccion = 'debo' | 'me_deben';

export interface Parte {
  usuarioId: string;
  monto: number;
  porcentaje: number | null;
  proporcion: number | null;
  liquidada: boolean;
}

export interface Nota {
  id: string;
  tableroId: string;
  creadoPor: string;
  tipo: TipoNota;
  titulo: string;
  descripcion: string | null;
  categoriaId: string | null;
  monto: number | null;
  modoReparto: ModoReparto;
  pagadoPor: string | null;
  estado: EstadoNota;
  fecha: string;
  venceEn: string | null;
  recurrencia: Recurrencia;
  contraparte: string | null;
  direccion: Direccion | null;
  abonado: number;
  /** A meses: plazo total. En compras, cada mensualidad es una nota (numeroCuota de plazoMeses, mismo planId). */
  plazoMeses: number | null;
  numeroCuota: number | null;
  planId: string | null;
  /** Total de la compra a meses (monto es la mensualidad de esta nota) */
  montoPlan: number | null;
  /** Pagada en otra moneda: lo original y el tipo de cambio (monto ya está en la moneda del tablero) */
  monedaOriginal: string | null;
  montoOriginal: number | null;
  tipoCambio: number | null;
  color: ColorNota;
  pinColor: string;
  posX: number;
  posY: number;
  rotacion: number;
  z: number;
  partes: Parte[];
  archivada: boolean;
  /** Fotos del ticket/recibo */
  adjuntos: Adjunto[];
  /** Cuántos comentarios tiene */
  comentarios: number;
  creadoEn: string;
}

export interface Adjunto {
  id: string;
  url: string;
  publicId: string;
  ancho: number | null;
  alto: number | null;
  subidoPor: string | null;
}

export interface Comentario {
  id: string;
  notaId: string;
  usuarioId: string | null;
  autor: string | null;
  color: string | null;
  avatarUrl: string | null;
  texto: string;
  menciones: string[];
  creadoEn: string;
}

export interface Participante {
  usuarioId: string;
  monto?: number;
  porcentaje?: number;
  proporcion?: number;
}

/** Lo que se manda al crear/editar una nota. */
export interface DatosNota {
  tipo?: TipoNota;
  titulo?: string;
  descripcion?: string | null;
  categoriaId?: string | null;
  monto?: number;
  plazoMeses?: number | null;
  modoReparto?: ModoReparto;
  participantes?: Participante[];
  pagadoPor?: string;
  estado?: 'por_pagar' | 'pagada';
  fecha?: string;
  venceEn?: string | null;
  recurrencia?: Recurrencia;
  contraparte?: string;
  direccion?: Direccion;
  monedaOriginal?: string | null;
  montoOriginal?: number;
  tipoCambio?: number;
  color?: ColorNota;
  pinColor?: string;
  posX?: number;
  posY?: number;
}

export interface Posicion {
  posX: number;
  posY: number;
}

export interface PosicionGuardada extends Posicion {
  id: string;
  rotacion: number;
  z: number;
}

export interface ResultadoPagarNota {
  nota: Nota;
  siguiente: Nota | null;
}
