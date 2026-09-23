import { ModoReparto, Participante } from '../models';

/**
 * Vista previa del reparto mientras se llena el formulario (misma regla que el
 * backend: centavos enteros y mayor residuo). El backend es quien decide al final.
 */
export function previsualizarReparto(total: number, modo: ModoReparto, participantes: Participante[]): number[] {
  const centavos = Math.round((total || 0) * 100);
  if (!participantes.length || centavos <= 0) return participantes.map(() => 0);
  if (modo === 'montos') return participantes.map((p) => p.monto ?? 0);

  const pesos = participantes.map((p) => {
    if (modo === 'porcentaje') return p.porcentaje ?? 0;
    if (modo === 'proporcion') return p.proporcion ?? 0;
    return 1;
  });
  const suma = pesos.reduce((a, b) => a + b, 0);
  if (suma <= 0) return participantes.map(() => 0);

  const exactos = pesos.map((p) => (centavos * p) / suma);
  const base = exactos.map(Math.floor);
  let resto = centavos - base.reduce((a, b) => a + b, 0);
  const orden = exactos.map((x, i) => ({ i, f: x - Math.floor(x) })).sort((a, b) => b.f - a.f || a.i - b.i);
  for (let k = 0; resto > 0; k = (k + 1) % orden.length, resto--) base[orden[k].i]++;
  return base.map((c) => c / 100);
}

/** Mensualidades de un total a N meses (los centavos que sobran van en las primeras), igual que el backend. */
export function mensualidades(total: number, meses: number): number[] {
  if (!(meses >= 1)) return [];
  return previsualizarReparto(total, 'igual', Array.from({ length: meses }, (_, i) => ({ usuarioId: String(i) })));
}

/** Cuántas mensualidades completas cubre lo pagado de una deuda a meses. */
export function mensualidadesCubiertas(total: number, meses: number, pagado: number): number {
  let resto = Math.round(pagado * 100);
  let cubiertas = 0;
  for (const m of mensualidades(total, meses)) {
    const centavos = Math.round(m * 100);
    if (resto < centavos) break;
    resto -= centavos;
    cubiertas++;
  }
  return cubiertas;
}
