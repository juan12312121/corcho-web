import { Injectable } from '@angular/core';

/**
 * localStorage a prueba de fallos (modo privado, almacenamiento bloqueado):
 * si no se puede leer o escribir, simplemente no persiste.
 */
@Injectable({ providedIn: 'root' })
export class AlmacenamientoService {
  leer<T>(clave: string): T | null {
    try {
      const texto = localStorage.getItem(clave);
      return texto ? (JSON.parse(texto) as T) : null;
    } catch {
      return null;
    }
  }

  guardar(clave: string, valor: unknown): void {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
    } catch {
      /* sin almacenamiento disponible: la sesión dura lo que dure la pestaña */
    }
  }

  borrar(clave: string): void {
    try {
      localStorage.removeItem(clave);
    } catch {
      /* nada que hacer */
    }
  }
}
