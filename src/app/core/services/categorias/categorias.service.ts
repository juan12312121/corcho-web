import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Categoria, DatosCategoria } from '../../models';

/** Categorías personalizadas de cada tablero. */
@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly api = inject(ApiService);

  listar(tableroId: string): Promise<Categoria[]> {
    return this.api.get(this.ruta(tableroId));
  }

  crear(tableroId: string, datos: DatosCategoria): Promise<Categoria> {
    return this.api.post(this.ruta(tableroId), datos);
  }

  editar(tableroId: string, categoriaId: string, cambios: DatosCategoria): Promise<Categoria> {
    return this.api.patch(`${this.ruta(tableroId)}/${categoriaId}`, cambios);
  }

  borrar(tableroId: string, categoriaId: string): Promise<void> {
    return this.api.delete(`${this.ruta(tableroId)}/${categoriaId}`);
  }

  private ruta(tableroId: string): string {
    return `/tableros/${tableroId}/categorias`;
  }
}
