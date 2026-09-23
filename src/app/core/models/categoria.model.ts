export interface Categoria {
  id: string;
  tableroId: string;
  nombre: string;
  /** Nombre de ícono de Material Symbols */
  icono: string;
  color: string;
  creadoPor: string | null;
}

export interface DatosCategoria {
  nombre?: string;
  icono?: string;
  color?: string;
}
