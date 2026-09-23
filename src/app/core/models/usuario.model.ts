export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  color: string;
  avatarUrl: string | null;
  telefono?: string | null;
  avisosWhatsapp?: boolean;
  clabe?: string | null;
  banco?: string | null;
  titularCuenta?: string | null;
  /** Privado: solo lo ves tú; los demás ven tu porcentaje para repartir */
  ingresoMensual?: number | null;
  /** Ya puede recibir pagos con tarjeta (Stripe) */
  stripeListo?: boolean;
}

export interface CambiosPerfil {
  nombre?: string;
  color?: string;
  avatarUrl?: string | null;
  telefono?: string | null;
  avisosWhatsapp?: boolean;
  clabe?: string | null;
  banco?: string | null;
  titularCuenta?: string | null;
  ingresoMensual?: number | null;
  password?: string;
  passwordActual?: string;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
}

export interface DatosLogin {
  email: string;
  password: string;
}
