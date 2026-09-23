import { computed, inject, Injectable, signal } from '@angular/core';
import { DatosTablero, TableroDetalle, TableroResumen } from '../../core/models';
import { TablerosService } from '../../core/services/tableros/tableros.service';
import { mensajeDeError } from '../../core/utils/errores';

/** Estado de la pantalla "Mis tableros" (se provee en la página, vive lo que ella). */
@Injectable()
export class MisTablerosStore {
  private readonly tableros = inject(TablerosService);

  private readonly lista = signal<TableroResumen[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly personales = computed(() => this.lista().filter((t) => t.tipo === 'personal'));
  readonly compartidos = computed(() => this.lista().filter((t) => t.tipo === 'compartido'));

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.lista.set(await this.tableros.listarMios());
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  crear(datos: DatosTablero): Promise<TableroDetalle> {
    return this.tableros.crear(datos);
  }
}
