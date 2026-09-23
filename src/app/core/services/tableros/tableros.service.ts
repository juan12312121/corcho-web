import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { DatosTablero, Tablero, TableroDetalle, TableroResumen, TipoTablero } from '../../models';

@Injectable({ providedIn: 'root' })
export class TablerosService {
  private readonly api = inject(ApiService);

  listarMios(tipo?: TipoTablero): Promise<TableroResumen[]> {
    return this.api.get('/tableros', { params: { tipo } });
  }

  obtener(id: string): Promise<TableroDetalle> {
    return this.api.get(`/tableros/${id}`);
  }

  crear(datos: DatosTablero): Promise<TableroDetalle> {
    return this.api.post('/tableros', datos);
  }

  editar(id: string, cambios: Partial<Pick<Tablero, 'nombre' | 'descripcion' | 'archivado'>>): Promise<Tablero> {
    return this.api.patch(`/tableros/${id}`, cambios);
  }

  cambiarTipo(id: string, tipo: TipoTablero): Promise<Tablero> {
    return this.api.patch(`/tableros/${id}/tipo`, { tipo });
  }

  borrar(id: string): Promise<void> {
    return this.api.delete(`/tableros/${id}`);
  }
}
