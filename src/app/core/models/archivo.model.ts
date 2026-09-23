/** Lo que da el servidor para subir directo a Cloudinary. */
export interface FirmaSubida {
  url: string;
  campos: Record<string, string | number>;
}

/** Lo que responde Cloudinary al subir. */
export interface ArchivoSubido {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
}
