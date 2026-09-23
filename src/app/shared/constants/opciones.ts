import { ColorNota, EstadoNota, MetodoPago, ModoReparto, Recurrencia, TipoNota } from '../../core/models';
import { OpcionColor } from '../components/selector-color/selector-color';
import { OpcionSegmento } from '../components/control-segmentado/control-segmentado';
import { TonoEtiqueta } from '../components/etiqueta/etiqueta';

/** Catálogos de la interfaz: una sola fuente para etiquetas, íconos y colores. */

export const COLORES_NOTA: OpcionColor[] = (
  [
    ['amarillo', 'Amarillo'],
    ['azul', 'Azul'],
    ['verde', 'Verde'],
    ['rosa', 'Rosa'],
    ['naranja', 'Naranja'],
    ['morado', 'Morado'],
  ] as [ColorNota, string][]
).map(([valor, etiqueta]) => ({ valor, etiqueta, css: `var(--nota-${valor})` }));

export const COLORES_CHINCHE: OpcionColor[] = (
  [
    ['rojo', 'Rojo'],
    ['azul', 'Azul'],
    ['verde', 'Verde'],
    ['amarillo', 'Amarillo'],
    ['morado', 'Morado'],
    ['naranja', 'Naranja'],
  ] as [string, string][]
).map(([valor, etiqueta]) => ({ valor, etiqueta, css: `var(--pin-${valor})` }));

export const TIPOS_NOTA: Record<TipoNota, OpcionSegmento<TipoNota>> = {
  gasto: { valor: 'gasto', etiqueta: 'Gasto', icono: 'shopping_cart' },
  servicio: { valor: 'servicio', etiqueta: 'Servicio', icono: 'bolt' },
  prestamo: { valor: 'prestamo', etiqueta: 'Préstamo', icono: 'handshake' },
  recordatorio: { valor: 'recordatorio', etiqueta: 'Recordatorio', icono: 'alarm' },
};

export const MODOS_REPARTO: OpcionSegmento<ModoReparto>[] = [
  { valor: 'igual', etiqueta: 'Igual' },
  { valor: 'montos', etiqueta: 'Montos' },
  { valor: 'porcentaje', etiqueta: '%' },
  { valor: 'proporcion', etiqueta: 'Proporción' },
];

export const RECURRENCIAS: { valor: Recurrencia; etiqueta: string }[] = [
  { valor: 'ninguna', etiqueta: 'Una sola vez' },
  { valor: 'semanal', etiqueta: 'Cada semana' },
  { valor: 'quincenal', etiqueta: 'Cada quincena' },
  { valor: 'mensual', etiqueta: 'Cada mes' },
];

export const METODOS_PAGO: OpcionSegmento<MetodoPago>[] = [
  { valor: 'efectivo', etiqueta: 'Efectivo', icono: 'payments' },
  { valor: 'transferencia', etiqueta: 'Transferencia', icono: 'account_balance' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta', icono: 'credit_card' },
];

/** Íconos para categorías personalizadas (Material Symbols). */
export const ICONOS_CATEGORIA = [
  'shopping_cart', 'restaurant', 'bolt', 'home', 'directions_car', 'medical_services', 'celebration', 'category',
  'pets', 'school', 'fitness_center', 'checkroom', 'flight', 'phone_iphone', 'sports_esports', 'local_gas_station',
  'child_care', 'savings', 'credit_card', 'redeem', 'local_bar', 'spa', 'build', 'wifi',
];

/** Colores para categorías (contrastan sobre fondo claro). */
export const COLORES_CATEGORIA: OpcionColor[] = [
  '#2E9E5B', '#F26B21', '#F2B705', '#1E4FA3', '#00A6A6', '#D64545', '#8A4FD6', '#775836', '#E4007C', '#4B5563',
].map((valor) => ({ valor, etiqueta: valor, css: valor }));

/** Plazos habituales de "meses sin intereses". */
export const PLAZOS_MESES = [3, 6, 9, 12, 18, 24];

export const ESTADOS_NOTA: Record<EstadoNota, { etiqueta: string; tono: TonoEtiqueta }> = {
  por_pagar: { etiqueta: 'Por pagar', tono: 'peligro' },
  pagada: { etiqueta: 'Pagada', tono: 'info' },
  liquidada: { etiqueta: 'Liquidada', tono: 'exito' },
};
