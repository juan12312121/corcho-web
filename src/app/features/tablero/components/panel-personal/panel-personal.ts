import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ResumenPersonal } from '../../../../core/models';
import { Icono } from '../../../../shared/components/icono/icono';
import { Monto } from '../../../../shared/components/monto/monto';
import { MonedaPipe } from '../../../../shared/pipes/moneda.pipe';
import { ChipCategoria } from '../../../../shared/components/chip-categoria/chip-categoria';
import { ListaPlanes } from '../lista-planes/lista-planes';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Panel "Resumen del mes" del tablero personal. */
@Component({
  selector: 'app-panel-personal',
  imports: [ChipCategoria, ListaPlanes, Icono, Monto, MonedaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panel-personal.html',
  styleUrl: './panel-personal.scss',
})
export class PanelPersonal {
  readonly resumen = input.required<ResumenPersonal>();
  readonly moneda = input('MXN');
  readonly abrirNota = output<string>();

  protected readonly nombreMes = computed(() => MESES[Number(this.resumen().mes.slice(5, 7)) - 1] ?? '');

  /** Barras de categorías relativas a la mayor. */
  protected readonly categorias = computed(() => {
    const lista = this.resumen().porCategoria;
    const mayor = Math.max(1, ...lista.map((c) => c.total));
    return lista.map((c) => ({ ...c, ancho: (c.total / mayor) * 100, clave: c.categoriaId ?? 'sin' }));
  });
}
