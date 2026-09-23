import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AvancePresupuesto, Categoria } from '../../../../core/models';
import { BarraProgreso } from '../../../../shared/components/barra-progreso/barra-progreso';
import { ChipCategoria } from '../../../../shared/components/chip-categoria/chip-categoria';
import { Icono } from '../../../../shared/components/icono/icono';
import { MonedaPipe } from '../../../../shared/pipes/moneda.pipe';

const COLOR_ESTADO: Record<AvancePresupuesto['estado'], string> = {
  ok: 'var(--positivo)',
  cerca: 'var(--acento)',
  excedido: 'var(--negativo)',
};

/** Presupuestos del mes: cuánto va de cada tope, en amarillo desde 80 % y rojo al pasarse. */
@Component({
  selector: 'app-avance-presupuestos',
  imports: [BarraProgreso, ChipCategoria, Icono, MonedaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avance-presupuestos.html',
  styleUrl: './avance-presupuestos.scss',
})
export class AvancePresupuestos {
  readonly avances = input.required<AvancePresupuesto[]>();
  readonly categorias = input.required<Map<string, Categoria>>();
  readonly moneda = input('MXN');
  /** Abrir el modal de categorías para poner o cambiar topes */
  readonly configurar = output<void>();

  protected readonly filas = computed(() =>
    this.avances()
      .map((a) => ({ ...a, categoria: this.categorias().get(a.categoriaId), color: COLOR_ESTADO[a.estado] }))
      .filter((a) => a.categoria)
      .sort((a, b) => b.porcentaje - a.porcentaje),
  );
  protected readonly excedidos = computed(() => this.avances().filter((a) => a.estado === 'excedido').length);
}
