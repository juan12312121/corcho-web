/**
 * Misma cuenta que el servidor (ComisionTarjeta.js), solo para mostrarla antes de pagar:
 * tarifa de Stripe en México 3.6 % + $3 + IVA, la cubre quien paga para que el otro
 * reciba exacto lo que le deben.
 */
export function comisionTarjeta(monto: number): { comision: number; total: number } {
  const neto = Math.round(monto * 100);
  const total = Math.ceil((neto + 3 * 100 * 1.16) / (1 - 0.036 * 1.16));
  return { comision: (total - neto) / 100, total: total / 100 };
}

export const MINIMO_CON_TARJETA = 10;
