import { ChangeDetectionStrategy, Component, computed, input, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Categoria, DatosCategoria } from '../../../../core/models';
import { AvisosService } from '../../../../core/services/avisos/avisos.service';
import { mensajeDeError } from '../../../../core/utils/errores';
import { Boton } from '../../../../shared/components/boton/boton';
import { ChipCategoria } from '../../../../shared/components/chip-categoria/chip-categoria';
import { Icono } from '../../../../shared/components/icono/icono';
import { Modal } from '../../../../shared/components/modal/modal';
import { MonedaPipe } from '../../../../shared/pipes/moneda.pipe';
import { TableroStore } from '../../tablero.store';
import { FormularioCategoria } from '../formulario-categoria/formulario-categoria';

/** Ver, crear, editar y quitar las categorías del tablero, y ponerles tope mensual (presupuesto). */
@Component({
  selector: 'app-categorias-modal',
  imports: [FormsModule, Modal, Boton, ChipCategoria, FormularioCategoria, Icono, MonedaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categorias-modal.html',
  styleUrl: './categorias-modal.scss',
})
export class CategoriasModal {
  protected readonly store = inject(TableroStore);
  private readonly avisos = inject(AvisosService);

  readonly abierto = input(false);
  readonly cerrar = output<void>();

  /** id de la que se está editando, 'nueva' o null */
  protected readonly editando = signal<string | null>(null);
  protected readonly enUso = computed(() => {
    const cuenta = new Map<string, number>();
    for (const n of this.store.notas()) if (n.categoriaId) cuenta.set(n.categoriaId, (cuenta.get(n.categoriaId) ?? 0) + 1);
    return cuenta;
  });

  /** Categoría cuyo tope mensual se está editando */
  protected readonly topeEditando = signal<string | null>(null);
  protected readonly guardandoTope = signal(false);
  protected montoTope: number | null = null;

  protected editarTope(categoriaId: string, limite: number | null): void {
    this.montoTope = limite;
    this.topeEditando.set(this.topeEditando() === categoriaId ? null : categoriaId);
  }

  protected async guardarTope(c: Categoria): Promise<void> {
    const monto = Number(this.montoTope);
    if (!(monto > 0)) {
      this.avisos.error('Escribe cuánto es lo máximo al mes');
      return;
    }
    this.guardandoTope.set(true);
    try {
      await this.store.guardarPresupuesto(c.id, monto);
      this.topeEditando.set(null);
      this.avisos.exito(`Tope de ${c.nombre} guardado`);
    } catch (e) {
      this.avisos.error(mensajeDeError(e));
    } finally {
      this.guardandoTope.set(false);
    }
  }

  protected async quitarTope(presupuestoId: string): Promise<void> {
    try {
      await this.store.borrarPresupuesto(presupuestoId);
      this.topeEditando.set(null);
    } catch (e) {
      this.avisos.error(mensajeDeError(e));
    }
  }

  protected puedeModificar(c: Categoria): boolean {
    return this.store.soyAdmin() || c.creadoPor === this.store.yoId();
  }

  protected readonly crear = async (datos: DatosCategoria): Promise<void> => {
    await this.store.crearCategoria(datos);
    this.editando.set(null);
    this.avisos.exito('Categoría creada');
  };

  protected guardarCambios(c: Categoria): (datos: DatosCategoria) => Promise<void> {
    return async (datos) => {
      await this.store.editarCategoria(c.id, datos);
      this.editando.set(null);
    };
  }

  protected async quitar(c: Categoria): Promise<void> {
    try {
      await this.store.borrarCategoria(c.id);
      this.avisos.info(`"${c.nombre}" quitada; sus notas quedaron sin categoría`);
    } catch (e) {
      this.avisos.error(mensajeDeError(e));
    }
  }
}
