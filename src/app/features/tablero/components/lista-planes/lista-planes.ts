import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PlanAMeses } from '../../../../core/models';
import { BarraProgreso } from '../../../../shared/components/barra-progreso/barra-progreso';
import { Icono } from '../../../../shared/components/icono/icono';
import { FechaCortaPipe } from '../../../../shared/pipes/fecha-corta.pipe';
import { MonedaPipe } from '../../../../shared/pipes/moneda.pipe';

/** "A meses": compras y deudas en mensualidades con su avance. Clic abre la nota. */
@Component({
  selector: 'app-lista-planes',
  imports: [BarraProgreso, Icono, MonedaPipe, FechaCortaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lista-planes.html',
  styleUrl: './lista-planes.scss',
})
export class ListaPlanes {
  readonly planes = input.required<PlanAMeses[]>();
  readonly moneda = input('MXN');
  readonly abrir = output<string>();

  protected readonly activos = computed(() => this.planes().filter((p) => !p.liquidado));
  protected readonly terminados = computed(() => this.planes().filter((p) => p.liquidado).length);

  protected descripcion(plan: PlanAMeses): string {
    if (plan.tipo === 'compra') return 'Compra a meses';
    if (!plan.contraparte) return 'Préstamo a meses';
    return plan.direccion === 'debo' ? `Le debo a ${plan.contraparte}` : `${plan.contraparte} me debe`;
  }
}
