import { computed, inject, Injectable, signal } from '@angular/core';
import { AlmacenamientoService } from '../almacenamiento/almacenamiento.service';
import { Sesion, Usuario } from '../../models';

const CLAVE = 'corcho.sesion';

/**
 * Estado de la sesión en signals. Es la fuente de verdad de "quién soy";
 * guards, interceptores y componentes la leen de aquí.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly almacenamiento = inject(AlmacenamientoService);
  private readonly sesion = signal<Sesion | null>(this.almacenamiento.leer<Sesion>(CLAVE));

  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly autenticado = computed(() => this.token() !== null);

  iniciar(sesion: Sesion): void {
    this.sesion.set(sesion);
    this.almacenamiento.guardar(CLAVE, sesion);
  }

  actualizarUsuario(usuario: Usuario): void {
    const actual = this.sesion();
    if (actual) this.iniciar({ ...actual, usuario });
  }

  cerrar(): void {
    this.sesion.set(null);
    this.almacenamiento.borrar(CLAVE);
  }
}
