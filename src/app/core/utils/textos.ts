/** Minúsculas y sin acentos, para buscar "cafe" y encontrar "Café". */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Copia al portapapeles; devuelve false si el navegador no lo permite. */
export async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/** CLABE en bloques para leerla fácil: 072 180 00123456789 7 */
export function formatearClabe(clabe: string): string {
  return clabe.length === 18 ? `${clabe.slice(0, 3)} ${clabe.slice(3, 6)} ${clabe.slice(6, 17)} ${clabe.slice(17)}` : clabe;
}
