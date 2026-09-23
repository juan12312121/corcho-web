import { AbstractControl, ValidationErrors } from '@angular/forms';

const PESOS = [3, 7, 1];

/** Misma regla que el backend: 18 dígitos y el último es verificador (pesos 3, 7, 1). */
export function esClabeValida(clabe: string): boolean {
  if (!/^\d{18}$/.test(clabe)) return false;
  const suma = [...clabe.slice(0, 17)].reduce((total, d, i) => total + ((Number(d) * PESOS[i % 3]) % 10), 0);
  return (10 - (suma % 10)) % 10 === Number(clabe[17]);
}

/** Solo dígitos (la gente la pega con espacios o guiones). */
export function limpiarClabe(texto: string): string {
  return texto.replace(/\D/g, '');
}

/** Validador de formularios: vacío está bien (es opcional). */
export function validarClabe(control: AbstractControl<string>): ValidationErrors | null {
  const clabe = limpiarClabe(control.value ?? '');
  if (!clabe) return null;
  if (clabe.length !== 18) return { clabe: 'La CLABE tiene 18 dígitos' };
  return esClabeValida(clabe) ? null : { clabe: 'Esa CLABE no es válida; revisa los dígitos' };
}
