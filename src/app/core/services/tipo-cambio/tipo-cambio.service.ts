import { Injectable } from '@angular/core';

const API = 'https://api.frankfurter.dev/v1/latest';

/**
 * Tipo de cambio del día (Banco Central Europeo, vía frankfurter.dev: gratis y sin llave).
 * Solo sugiere: la persona puede corregirlo con el que le cobró su banco.
 */
@Injectable({ providedIn: 'root' })
export class TipoCambioService {
  private readonly cache = new Map<string, number>();

  async obtener(de: string, a: string): Promise<number | null> {
    if (de === a) return 1;
    const clave = `${de}-${a}`;
    if (this.cache.has(clave)) return this.cache.get(clave)!;
    try {
      const respuesta = await fetch(`${API}?base=${encodeURIComponent(de)}&symbols=${encodeURIComponent(a)}`);
      if (!respuesta.ok) return null;
      const tasa = (await respuesta.json())?.rates?.[a];
      if (typeof tasa !== 'number') return null;
      this.cache.set(clave, tasa);
      return tasa;
    } catch {
      return null;
    }
  }
}
