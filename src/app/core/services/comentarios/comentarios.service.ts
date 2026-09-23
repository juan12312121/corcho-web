import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Comentario } from '../../models';

/** Comentarios de una nota, con @menciones a miembros del tablero. */
@Injectable({ providedIn: 'root' })
export class ComentariosService {
  private readonly api = inject(ApiService);

  listar(tableroId: string, notaId: string): Promise<Comentario[]> {
    return this.api.get(this.ruta(tableroId, notaId));
  }

  crear(tableroId: string, notaId: string, texto: string, menciones: string[]): Promise<Comentario> {
    return this.api.post(this.ruta(tableroId, notaId), { texto, menciones });
  }

  borrar(tableroId: string, notaId: string, comentarioId: string): Promise<void> {
    return this.api.delete(`${this.ruta(tableroId, notaId)}/${comentarioId}`);
  }

  private ruta(tableroId: string, notaId: string): string {
    return `/tableros/${tableroId}/notas/${notaId}/comentarios`;
  }
}
