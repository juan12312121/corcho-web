import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Categoria, Miembro, Nota } from '../../../../core/models';
import { mensualidadesCubiertas } from '../../../../core/utils/reparto';
import { ChipCategoria } from '../../../../shared/components/chip-categoria/chip-categoria';
import { diasHasta } from '../../../../core/utils/fechas';
import { Avatar } from '../../../../shared/components/avatar/avatar';
import { BarraProgreso } from '../../../../shared/components/barra-progreso/barra-progreso';
import { Etiqueta } from '../../../../shared/components/etiqueta/etiqueta';
import { Icono } from '../../../../shared/components/icono/icono';
import { Monto } from '../../../../shared/components/monto/monto';
import { NotaAdhesiva } from '../../../../shared/components/nota-adhesiva/nota-adhesiva';
import { TIPOS_NOTA } from '../../../../shared/constants/opciones';
import { FechaCortaPipe } from '../../../../shared/pipes/fecha-corta.pipe';
import { MonedaPipe } from '../../../../shared/pipes/moneda.pipe';
import { VencimientoPipe } from '../../../../shared/pipes/vencimiento.pipe';

/** Contenido de una nota tal como se ve clavada en el corcho. */
@Component({
  selector: 'app-nota-corcho',
  imports: [ChipCategoria, NotaAdhesiva, Etiqueta, Icono, Monto, Avatar, BarraProgreso, MonedaPipe, FechaCortaPipe, VencimientoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nota-corcho.html',
  styleUrl: './nota-corcho.scss',
})
export class NotaCorcho {
  readonly nota = input.required<Nota>();
  readonly miembros = input.required<Map<string, Miembro>>();
  readonly categorias = input<Map<string, Categoria>>(new Map());
  readonly moneda = input('MXN');
  readonly levantada = input(false);
  /** Nombre de quien la está moviendo ahora mismo (otra persona). */
  readonly movidaPor = input<string | null>(null);

  protected readonly tipo = computed(() => TIPOS_NOTA[this.nota().tipo]);
  protected readonly categoria = computed(() => this.categorias().get(this.nota().categoriaId ?? '') ?? null);
  /** "Mensualidad 3 de 12" (compra) o "2/6 meses" (deuda que se va pagando). */
  protected readonly aMeses = computed(() => {
    const n = this.nota();
    if (!n.plazoMeses) return null;
    if (n.numeroCuota) return { texto: `Mensualidad ${n.numeroCuota} de ${n.plazoMeses}`, total: n.montoPlan };
    const pagadas = mensualidadesCubiertas(n.monto ?? 0, n.plazoMeses, n.abonado);
    return { texto: `${pagadas}/${n.plazoMeses} meses pagados`, total: null };
  });
  protected readonly liquidada = computed(() => this.nota().estado === 'liquidada');
  protected readonly porPagar = computed(() => this.nota().estado === 'por_pagar');
  protected readonly externa = computed(() => this.nota().contraparte !== null);
  protected readonly vencida = computed(() => {
    const vence = this.nota().venceEn;
    return this.porPagar() && vence !== null && diasHasta(vence) < 0;
  });
  protected readonly pagador = computed(() => this.miembros().get(this.nota().pagadoPor ?? ''));
  protected readonly partes = computed(() =>
    this.nota()
      .partes.map((p) => ({ ...p, miembro: this.miembros().get(p.usuarioId) }))
      .filter((p) => p.miembro !== undefined),
  );
  /** En reparto igual, lo que le toca a cada quien ("$312.50 c/u"). */
  protected readonly porCabeza = computed(() => {
    const n = this.nota();
    return n.modoReparto === 'igual' && n.partes.length > 1 ? n.partes[0].monto : null;
  });
  protected readonly avanceAbonos = computed(() => {
    const n = this.nota();
    return n.monto ? n.abonado / n.monto : 0;
  });
}
