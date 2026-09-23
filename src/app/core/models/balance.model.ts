export interface Transferencia {
  de: string;
  a: string;
  monto: number;
}

/** Algo que se paga a meses: compra (una nota por mensualidad) o deuda (una nota que se va pagando). */
export interface PlanAMeses {
  tipo: 'compra' | 'deuda';
  planId: string;
  notaId: string;
  titulo: string;
  total: number;
  mensualidad: number;
  meses: number;
  pagadas: number;
  pagado: number;
  restante: number;
  proximaFecha: string | null;
  liquidado: boolean;
  contraparte: string | null;
  direccion: 'debo' | 'me_deben' | null;
}

export interface AvancePresupuesto {
  presupuestoId: string;
  categoriaId: string;
  limite: number;
  gastado: number;
  restante: number;
  porcentaje: number;
  estado: 'ok' | 'cerca' | 'excedido';
}

export interface BalanceCompartido {
  tipo: 'compartido';
  planes: PlanAMeses[];
  presupuestos: AvancePresupuesto[];
  totales: { gastado: number; porPagar: number; vencidas: number };
  netos: { usuarioId: string; nombre: string; color: string; neto: number }[];
  entrePares: Transferencia[];
  sugerencias: Transferencia[];
  mio: { neto: number; debo: number; meDeben: number };
}

export interface TotalYCantidad {
  total: number;
  cantidad: number;
}

export interface ResumenPersonal {
  tipo: 'personal';
  mes: string;
  gastadoMes: number;
  /** Flujo del mes: lo que entró y lo que queda (entró − salió) */
  ingresosMes: number;
  disponible: number;
  porCategoria: { categoriaId: string | null; nombre: string; icono: string; color: string; total: number }[];
  planes: PlanAMeses[];
  porPagar: TotalYCantidad;
  vencidas: TotalYCantidad;
  proximas: TotalYCantidad & { dias: number };
  debo: number;
  meDeben: number;
  presupuestos: AvancePresupuesto[];
}

export type Balance = BalanceCompartido | ResumenPersonal;
