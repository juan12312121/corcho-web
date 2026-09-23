import { computed, inject, Injectable, signal } from '@angular/core';
import { Reporte } from '../../core/models';
import { ReportesService } from '../../core/services/reportes/reportes.service';
import { mensajeDeError } from '../../core/utils/errores';
import { aNombreArchivo, descargarCsv } from '../../core/utils/exportar';
import { nombreMes } from '../../core/utils/fechas';
import { Columna, Segmento } from '../../shared/components/graficas/grafica-barras';
import { TIPOS_NOTA } from '../../shared/constants/opciones';

const SIN_CATEGORIA = { nombre: 'Sin categoría', color: '#A8A29E' };

/** Estado de la página de reportes: pide el reporte y lo prepara para gráficas y exportación. */
@Injectable()
export class ReportesStore {
  private readonly api = inject(ReportesService);

  readonly reporte = signal<Reporte | null>(null);
  readonly meses = signal(6);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  private tableroId = '';

  readonly moneda = computed(() => this.reporte()?.tablero.moneda ?? 'MXN');
  readonly esCompartido = computed(() => this.reporte()?.tablero.tipo === 'compartido');
  private readonly categorias = computed(() => new Map((this.reporte()?.categorias ?? []).map((c) => [c.id, c])));
  private readonly personas = computed(() => new Map((this.reporte()?.personas ?? []).map((p) => [p.usuarioId, p])));

  /** Barras apiladas: una columna por mes, un segmento por categoría. */
  readonly columnas = computed<Columna[]>(() =>
    (this.reporte()?.porMes ?? []).map((m) => ({
      etiqueta: nombreMes(m.mes),
      segmentos: Object.entries(m.categorias).map(([id, valor]) => ({ ...this.categoria(id === 'sin' ? null : id), valor })),
    })),
  );

  readonly porCategoria = computed<Segmento[]>(() =>
    (this.reporte()?.porCategoria ?? []).map((c) => ({ ...this.categoria(c.categoriaId), valor: c.total })),
  );

  readonly porPersona = computed(() => {
    const lista = this.reporte()?.porPersona ?? [];
    const maximo = Math.max(1, ...lista.flatMap((p) => [p.total, p.pagado]));
    return lista.map((p) => ({
      ...p,
      nombre: this.personas().get(p.usuarioId)?.nombre ?? 'Alguien',
      color: this.personas().get(p.usuarioId)?.color ?? '#74777f',
      ancho: (p.total / maximo) * 100,
      anchoPagado: (p.pagado / maximo) * 100,
    }));
  });

  readonly detalle = computed(() =>
    (this.reporte()?.detalle ?? []).map((d) => ({
      ...d,
      categoria: this.categoria(d.categoriaId),
      tipoTexto: TIPOS_NOTA[d.tipo as keyof typeof TIPOS_NOTA]?.etiqueta ?? d.tipo,
      pagador: d.pagadoPor ? (this.personas().get(d.pagadoPor)?.nombre ?? '—') : '—',
    })),
  );

  /** El mes con más gasto (para el resumen de arriba). */
  readonly mesMasCaro = computed(() => {
    const meses = this.reporte()?.porMes ?? [];
    const mayor = meses.reduce<(typeof meses)[number] | null>((max, m) => (!max || m.total > max.total ? m : max), null);
    return mayor && mayor.total > 0 ? { ...mayor, nombre: nombreMes(mayor.mes, true) } : null;
  });

  async abrir(tableroId: string): Promise<void> {
    this.tableroId = tableroId;
    await this.cargar();
  }

  async cambiarMeses(meses: number): Promise<void> {
    this.meses.set(meses);
    await this.cargar();
  }

  /** Excel: el detalle de gastos más un resumen por categoría y por mes. */
  exportarExcel(): void {
    const r = this.reporte();
    if (!r) return;
    const filas: (string | number | null)[][] = [
      [`Reporte de ${r.tablero.nombre}`, `${nombreMes(r.periodo.desde, true)} a ${nombreMes(r.periodo.hasta, true)}`],
      [],
      ['Fecha', 'Concepto', 'Tipo', 'Categoría', 'Pagó', `Monto (${r.tablero.moneda})`],
      ...this.detalle().map((d) => [d.fecha, d.titulo, d.tipoTexto, d.categoria.nombre, d.pagador, d.monto]),
      [],
      ['Por categoría', '', '', '', '', 'Total'],
      ...this.porCategoria().map((c) => [c.nombre, '', '', '', '', c.valor]),
      [],
      ...(this.esCompartido()
        ? [['Por persona', '', 'Le tocó', 'Pagó', 'Veces que pagó primero', 'Diferencia'], ...this.porPersona().map((p) => [p.nombre, '', p.total, p.pagado, p.veces, p.diferencia]), []]
        : []),
      ['Por mes', '', '', '', 'Notas', 'Total'],
      ...r.porMes.map((m) => [nombreMes(m.mes, true), '', '', '', m.cantidad, m.total]),
      [],
      ['Total', '', '', '', '', r.total],
    ];
    descargarCsv(`reporte-${aNombreArchivo(r.tablero.nombre)}-${r.periodo.hasta}.csv`, filas);
  }

  private categoria(id: string | null): { nombre: string; color: string } {
    const c = id ? this.categorias().get(id) : null;
    return c ? { nombre: c.nombre, color: c.color } : SIN_CATEGORIA;
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.reporte.set(await this.api.obtener(this.tableroId, this.meses()));
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
