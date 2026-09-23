import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Adjunto, ArchivoSubido, DatosNota, Nota, Posicion, PosicionGuardada, ResultadoPagarNota } from '../../models';

export interface FiltrosNotas {
  /** Busca en título, descripción y contraparte */
  q?: string;
  /** true = el archivo (notas saldadas que se quitaron del corcho) */
  archivadas?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotasService {
  private readonly api = inject(ApiService);

  listar(tableroId: string, filtros: FiltrosNotas = {}): Promise<Nota[]> {
    return this.api.get(this.ruta(tableroId), { params: { ...filtros } });
  }

  crear(tableroId: string, datos: DatosNota): Promise<Nota> {
    return this.api.post(this.ruta(tableroId), datos);
  }

  editar(tableroId: string, notaId: string, cambios: DatosNota): Promise<Nota> {
    return this.api.patch(this.ruta(tableroId, notaId), cambios);
  }

  /** `conexionId` evita que a quien movió le llegue su propio eco en vivo. */
  mover(tableroId: string, notaId: string, posicion: Posicion, conexionId?: string): Promise<PosicionGuardada> {
    const headers: Record<string, string> = conexionId ? { 'X-Socket-Id': conexionId } : {};
    return this.api.patch(`${this.ruta(tableroId, notaId)}/posicion`, { ...posicion, alFrente: true }, { headers });
  }

  pagar(tableroId: string, notaId: string, pagadoPor?: string): Promise<ResultadoPagarNota> {
    return this.api.post(`${this.ruta(tableroId, notaId)}/pagar`, pagadoPor ? { pagadoPor } : {});
  }

  abonar(tableroId: string, notaId: string, monto: number): Promise<Nota> {
    return this.api.post(`${this.ruta(tableroId, notaId)}/abonos`, { monto });
  }

  archivar(tableroId: string, notaId: string, archivada: boolean): Promise<Nota> {
    return this.api.patch(`${this.ruta(tableroId, notaId)}/archivo`, { archivada });
  }

  /** Manda al archivo todo lo que ya no tiene nada pendiente. */
  archivarSaldadas(tableroId: string): Promise<{ archivadas: number }> {
    return this.api.post(`${this.ruta(tableroId)}/archivar-saldadas`);
  }

  /** Pega a la nota una foto que ya se subió a Cloudinary. */
  agregarFoto(tableroId: string, notaId: string, foto: ArchivoSubido): Promise<Adjunto> {
    return this.api.post(`${this.ruta(tableroId, notaId)}/adjuntos`, {
      publicId: foto.public_id,
      url: foto.secure_url,
      ancho: foto.width,
      alto: foto.height,
    });
  }

  quitarFoto(tableroId: string, notaId: string, adjuntoId: string): Promise<void> {
    return this.api.delete(`${this.ruta(tableroId, notaId)}/adjuntos/${adjuntoId}`);
  }

  borrar(tableroId: string, notaId: string): Promise<void> {
    return this.api.delete(this.ruta(tableroId, notaId));
  }

  private ruta(tableroId: string, notaId?: string): string {
    const base = `/tableros/${tableroId}/notas`;
    return notaId ? `${base}/${notaId}` : base;
  }
}
