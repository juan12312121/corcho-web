const DIA_MS = 864e5;

/** 'AAAA-MM-DD' de hoy en la zona local. */
export function hoyISO(ahora = new Date()): string {
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Días de hoy a la fecha (negativo = ya pasó). */
export function diasHasta(fecha: string, ahora = new Date()): number {
  const [a, m, d] = fecha.split('-').map(Number);
  const objetivo = Date.UTC(a, m - 1, d);
  const [ha, hm, hd] = hoyISO(ahora).split('-').map(Number);
  return Math.round((objetivo - Date.UTC(ha, hm - 1, hd)) / DIA_MS);
}

/** "Vence hoy", "Vence en 3 días", "Vencida hace 2 días". */
export function textoVencimiento(fecha: string, ahora = new Date()): string {
  const dias = diasHasta(fecha, ahora);
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Vence mañana';
  if (dias > 1) return `Vence en ${dias} días`;
  return dias === -1 ? 'Venció ayer' : `Vencida hace ${-dias} días`;
}

/** "hace un momento", "hace 5 min", "hace 3 h", "ayer", "12 sep". */
export function haceCuanto(fechaHora: string, ahora = new Date()): string {
  const fecha = new Date(fechaHora);
  const minutos = Math.floor((ahora.getTime() - fecha.getTime()) / 60_000);
  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;
  if (minutos < 24 * 60) return `hace ${Math.floor(minutos / 60)} h`;
  if (minutos < 48 * 60) return 'ayer';
  return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** 'AAAA-MM' → "sep 26" (o "septiembre 2026" con `largo`). */
export function nombreMes(mes: string, largo = false): string {
  const [anio, numero] = mes.split('-').map(Number);
  const nombre = MESES[numero - 1] ?? mes;
  return largo ? `${nombre} ${anio}` : `${nombre.slice(0, 3)} ${String(anio).slice(2)}`;
}
