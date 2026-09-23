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
