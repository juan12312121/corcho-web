import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvisosService } from '../../../../core/services/avisos/avisos.service';
import { mensajeDeError } from '../../../../core/utils/errores';
import { interpretarEstadoDeCuenta, leerCsv, MovimientoLeido } from '../../../../core/utils/estado-de-cuenta';
import { Boton } from '../../../../shared/components/boton/boton';
import { Icono } from '../../../../shared/components/icono/icono';
import { Modal } from '../../../../shared/components/modal/modal';
import { FechaCortaPipe } from '../../../../shared/pipes/fecha-corta.pipe';
import { MonedaPipe } from '../../../../shared/pipes/moneda.pipe';
import { TableroStore } from '../../tablero.store';

const MAXIMO = 300;
const MAXIMO_BYTES = 2 * 1024 * 1024;

/**
 * Importar el estado de cuenta del banco (CSV): se lee en el navegador, se revisa
 * fila por fila (incluir, tipo, categoría) y se manda todo junto al servidor.
 */
@Component({
  selector: 'app-importar-modal',
  imports: [FormsModule, Modal, Boton, Icono, MonedaPipe, FechaCortaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './importar-modal.html',
  styleUrl: './importar-modal.scss',
})
export class ImportarModal {
  protected readonly store = inject(TableroStore);
  private readonly avisos = inject(AvisosService);

  readonly abierto = input(false);
  readonly cerrar = output<void>();

  protected readonly archivo = signal<string | null>(null);
  protected readonly filas = signal<MovimientoLeido[]>([]);
  protected readonly ignoradas = signal(0);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** categoría que se asigna a los gastos que no tengan una */
  protected categoriaGeneral: string | null = null;

  protected readonly incluidas = computed(() => this.filas().filter((f) => f.incluido));
  protected readonly totales = computed(() => {
    const sumar = (tipo: string) => this.incluidas().filter((f) => f.tipo === tipo).reduce((t, f) => t + f.monto, 0);
    return { gastos: sumar('gasto'), ingresos: sumar('ingreso') };
  });

  constructor() {
    effect(() => {
      if (this.abierto()) this.reiniciar();
    });
  }

  protected async elegir(evento: Event): Promise<void> {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    campo.value = '';
    if (!archivo) return;
    this.error.set(null);
    if (archivo.size > MAXIMO_BYTES) {
      this.error.set('El archivo pesa más de 2 MB; exporta un periodo más corto');
      return;
    }
    const { movimientos, ignoradas } = interpretarEstadoDeCuenta(leerCsv(await archivo.text()));
    if (!movimientos.length) {
      this.error.set('No encontré movimientos. El CSV necesita columnas de fecha, concepto y monto (o cargo/abono).');
      return;
    }
    // En un tablero compartido no hay ingresos: esos se muestran pero no se importan
    const soloGastos = !this.store.esPersonal();
    this.filas.set(movimientos.slice(0, MAXIMO).map((m) => ({ ...m, incluido: !(soloGastos && m.tipo === 'ingreso') })));
    this.ignoradas.set(ignoradas + Math.max(0, movimientos.length - MAXIMO));
    this.archivo.set(archivo.name);
  }

  protected alternar(fila: MovimientoLeido): void {
    if (!this.store.esPersonal() && fila.tipo === 'ingreso') return;
    this.filas.update((lista) => lista.map((f) => (f === fila ? { ...f, incluido: !f.incluido } : f)));
  }

  protected cambiar(fila: MovimientoLeido, cambios: Partial<MovimientoLeido>): void {
    this.filas.update((lista) => lista.map((f) => (f === fila ? { ...f, ...cambios } : f)));
  }

  protected todas(incluir: boolean): void {
    const personal = this.store.esPersonal();
    this.filas.update((lista) => lista.map((f) => ({ ...f, incluido: incluir && (personal || f.tipo === 'gasto') })));
  }

  protected async importar(): Promise<void> {
    const movimientos = this.incluidas().map(({ tipo, titulo, monto, fecha, categoriaId }) => ({
      tipo,
      titulo: titulo.trim() || 'Movimiento',
      monto,
      fecha,
      categoriaId: tipo === 'gasto' ? (categoriaId ?? this.categoriaGeneral) : null,
    }));
    if (!movimientos.length) return;
    this.enviando.set(true);
    this.error.set(null);
    try {
      const r = await this.store.importar(movimientos);
      const cuantos = (n: number, uno: string, varios: string) => n && `${n} ${n === 1 ? uno : varios}`;
      const partes = [cuantos(r.gastos, 'gasto', 'gastos'), cuantos(r.ingresos, 'ingreso', 'ingresos')].filter(Boolean).join(' y ');
      this.avisos.exito(`Importados ${partes}${r.archivadas && r.gastos ? ' (los gastos están en el archivo)' : ''}`);
      this.cerrar.emit();
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }

  private reiniciar(): void {
    this.archivo.set(null);
    this.filas.set([]);
    this.ignoradas.set(0);
    this.error.set(null);
    this.categoriaGeneral = null;
  }
}
