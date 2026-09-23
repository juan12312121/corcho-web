import { Injectable, signal } from '@angular/core';

export type TipoAviso = 'exito' | 'error' | 'info';

export interface Aviso {
  id: number;
  tipo: TipoAviso;
  texto: string;
}

const DURACION_MS = 4000;
const MAXIMO_VISIBLES = 4;

/** Mensajes flotantes (toasts). El componente <app-avisos> los pinta. */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private siguienteId = 1;
  private readonly lista = signal<Aviso[]>([]);
  readonly avisos = this.lista.asReadonly();

  exito(texto: string): void {
    this.mostrar('exito', texto);
  }

  error(texto: string): void {
    this.mostrar('error', texto);
  }

  info(texto: string): void {
    this.mostrar('info', texto);
  }

  cerrar(id: number): void {
    this.lista.update((avisos) => avisos.filter((a) => a.id !== id));
  }

  private mostrar(tipo: TipoAviso, texto: string): void {
    const aviso: Aviso = { id: this.siguienteId++, tipo, texto };
    this.lista.update((avisos) => [...avisos.slice(-(MAXIMO_VISIBLES - 1)), aviso]);
    setTimeout(() => this.cerrar(aviso.id), DURACION_MS);
  }
}
