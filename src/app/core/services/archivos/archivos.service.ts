import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { ArchivoSubido, FirmaSubida } from '../../models';
import { reducirImagen } from '../../utils/imagenes';

const MAXIMO_BYTES = 10 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/** El archivo no es una foto aceptable o Cloudinary lo rechazó (el mensaje es para mostrar). */
export class ArchivoInvalidoError extends Error {}

/**
 * Fotos (tickets y avatar). El servidor firma y el navegador sube DIRECTO a
 * Cloudinary: el secreto nunca llega aquí y el backend no carga con la imagen.
 */
@Injectable({ providedIn: 'root' })
export class ArchivosService {
  private readonly api = inject(ApiService);

  firmaDeTablero(tableroId: string): Promise<FirmaSubida> {
    return this.api.post(`/tableros/${tableroId}/notas/fotos/firma`);
  }

  firmaDeAvatar(): Promise<FirmaSubida> {
    return this.api.post('/auth/yo/foto/firma');
  }

  /** Revisa, achica (las fotos de celular pesan mucho) y sube con la firma. */
  async subir(firma: FirmaSubida, archivo: File): Promise<ArchivoSubido> {
    validarImagen(archivo);
    const cuerpo = new FormData();
    for (const [clave, valor] of Object.entries(firma.campos)) cuerpo.append(clave, String(valor));
    cuerpo.append('file', await reducirImagen(archivo));
    const respuesta = await fetch(firma.url, { method: 'POST', body: cuerpo });
    if (!respuesta.ok) throw new ArchivoInvalidoError('No se pudo subir la foto; intenta con otra');
    return respuesta.json();
  }
}

export function validarImagen(archivo: File): void {
  if (!TIPOS.includes(archivo.type)) throw new ArchivoInvalidoError('Solo fotos (JPG, PNG, WEBP o HEIC)');
  if (archivo.size > MAXIMO_BYTES) throw new ArchivoInvalidoError('La foto pesa más de 10 MB');
}
