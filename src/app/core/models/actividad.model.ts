export interface Actividad {
  id: string;
  tableroId: string;
  usuarioId: string | null;
  tipo: string;
  datos: Record<string, unknown>;
  creadoEn: string;
}
