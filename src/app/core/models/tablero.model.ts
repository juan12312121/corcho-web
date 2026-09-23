import { ColorNota, EstadoNota, TipoNota } from './nota.model';

export type TipoTablero = 'personal' | 'compartido';
export type Rol = 'propietario' | 'admin' | 'miembro';

export interface Tablero {
  id: string;
  nombre: string;
  descripcion: string | null;
  moneda: string;
  fondo: string;
  tipo: TipoTablero;
  propietarioId: string;
  archivado: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

/** Persona del tablero con sus datos públicos (avatares). */
export interface Integrante {
  usuarioId: string;
  nombre: string;
  color: string;
  avatarUrl: string | null;
}

export interface Miembro extends Integrante {
  rol: Rol;
  apodo: string | null;
  email: string;
  unidoEn: string;
  /** Datos para transferirle (si los llenó en su perfil) */
  clabe: string | null;
  banco: string | null;
  titularCuenta: string | null;
  /** % del ingreso total del tablero (el monto es privado); null si no lo registró */
  pesoIngreso: number | null;
  /** Ya conectó su cuenta de Stripe: se le puede pagar con tarjeta */
  cobraConTarjeta: boolean;
}

/** Nota en miniatura para la tarjeta del tablero. */
export interface NotaVistaPrevia {
  titulo: string;
  monto: number | null;
  color: ColorNota;
  pinColor: string;
  tipo: TipoNota;
  estado: EstadoNota;
}

/** Tarjeta de "Mis tableros". */
export interface TableroResumen extends Tablero {
  miRol: Rol;
  miNeto: number;
  notasAbiertas: number;
  porPagar: number;
  integrantes: Integrante[];
  vistaPrevia: NotaVistaPrevia[];
}

export interface TableroDetalle extends Tablero {
  miRol: Rol;
  miembros: Miembro[];
}

export interface DatosTablero {
  nombre: string;
  tipo: TipoTablero;
  descripcion?: string | null;
  moneda?: string;
}
