const LADO_MAXIMO = 1600;
const CALIDAD = 0.82;
const SIN_REDUCIR_BYTES = 1_000_000;

/**
 * Achica una foto a 1600 px por lado (JPEG). Un ticket se sigue leyendo bien y
 * pesa mucho menos. Si el navegador no puede leerla (p. ej. HEIC), va tal cual.
 */
export async function reducirImagen(archivo: File): Promise<Blob> {
  if (archivo.type === 'image/heic' || archivo.type === 'image/heif') return archivo;
  try {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    if (escala === 1 && archivo.size < SIN_REDUCIR_BYTES) return archivo;
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext('2d')?.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    imagen.close();
    const reducida = await new Promise<Blob | null>((listo) => lienzo.toBlob(listo, 'image/jpeg', CALIDAD));
    return reducida && reducida.size < archivo.size ? reducida : archivo;
  } catch {
    return archivo;
  }
}

/** Versión chica de una foto de Cloudinary (miniaturas) sin bajar la original. */
export function miniatura(url: string, lado = 240): string {
  return url.replace('/image/upload/', `/image/upload/c_fill,w_${lado},h_${lado},q_auto,f_auto/`);
}
