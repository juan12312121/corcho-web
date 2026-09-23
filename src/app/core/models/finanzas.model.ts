/** Dinero que entra en un tablero personal (sueldo, ventas…). */
export interface Ingreso {
  id: string;
  tableroId: string;
  concepto: string;
  monto: number;
  fecha: string;
  /** true = cuenta cada mes a partir de su fecha */
  recurrente: boolean;
}

export interface DatosIngreso {
  concepto: string;
  monto: number;
  fecha?: string;
  recurrente?: boolean;
}

/** Meta de ahorro con lo que lleva juntado. */
export interface Meta {
  id: string;
  tableroId: string;
  creadoPor: string | null;
  nombre: string;
  objetivo: number;
  fechaLimite: string | null;
  color: string;
  ahorrado: number;
  aportes: number;
}

export interface DatosMeta {
  nombre: string;
  objetivo: number;
  fechaLimite?: string | null;
  color?: string;
}

/** Una línea del estado de cuenta ya leída del CSV. */
export interface Movimiento {
  tipo: 'gasto' | 'ingreso';
  titulo: string;
  monto: number;
  fecha: string;
  categoriaId?: string | null;
}

export interface ResultadoImportacion {
  gastos: number;
  ingresos: number;
  /** En un tablero personal los gastos importados van directo al archivo */
  archivadas: boolean;
}
