import { Rol } from './tablero.model';

export interface Invitacion {
  id: string;
  tableroId: string;
  email: string | null;
  codigo: string;
  rol: Exclude<Rol, 'propietario'>;
  estado: 'pendiente' | 'aceptada' | 'rechazada' | 'cancelada';
  usosMax: number | null;
  usos: number;
  expiraEn: string;
}

export interface VistaInvitacion {
  codigo: string;
  estado: Invitacion['estado'];
  tableroId: string;
  tablero: string;
  descripcion: string | null;
  invitadoPor: string;
  miembros: number;
  expiraEn: string;
  vigente: boolean;
}

export interface InvitacionPendiente {
  id: string;
  codigo: string;
  tableroId: string;
  tablero: string;
  invitadoPor: string;
  expiraEn: string;
}

export interface DatosInvitacion {
  email?: string;
  usosMax?: number;
  dias?: number;
}
