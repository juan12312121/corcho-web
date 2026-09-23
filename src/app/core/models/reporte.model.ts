export interface Reporte {
  tablero: { id: string; nombre: string; tipo: 'personal' | 'compartido'; moneda: string };
  periodo: { desde: string; hasta: string; meses: number };
  total: number;
  promedioMensual: number;
  porMes: { mes: string; total: number; cantidad: number; categorias: Record<string, number> }[];
  porCategoria: { categoriaId: string | null; total: number }[];
  porPersona: { usuarioId: string; total: number }[];
  detalle: { fecha: string; titulo: string; tipo: string; categoriaId: string | null; monto: number; pagadoPor: string | null }[];
  categorias: { id: string; nombre: string; icono: string; color: string }[];
  personas: { usuarioId: string; nombre: string; color: string }[];
}
