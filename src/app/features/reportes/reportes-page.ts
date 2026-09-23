import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Boton } from '../../shared/components/boton/boton';
import { Cargando } from '../../shared/components/cargando/cargando';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';
import { GraficaBarras } from '../../shared/components/graficas/grafica-barras';
import { GraficaDona } from '../../shared/components/graficas/grafica-dona';
import { Icono } from '../../shared/components/icono/icono';
import { FechaCortaPipe } from '../../shared/pipes/fecha-corta.pipe';
import { MonedaPipe } from '../../shared/pipes/moneda.pipe';
import { ReportesStore } from './reportes.store';

/** Reportes del tablero: gasto por mes, por categoría y por persona; exporta a Excel o PDF. */
@Component({
  selector: 'app-reportes-page',
  imports: [RouterLink, Boton, Cargando, EstadoVacio, GraficaBarras, GraficaDona, Icono, MonedaPipe, FechaCortaPipe],
  providers: [ReportesStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reportes-page.html',
  styleUrl: './reportes-page.scss',
})
export class ReportesPage {
  protected readonly store = inject(ReportesStore);
  private readonly title = inject(Title);

  /** :tableroId de la ruta */
  readonly tableroId = input.required<string>();

  protected readonly opcionesMeses = [3, 6, 12];

  constructor() {
    effect(() => {
      const id = this.tableroId();
      untracked(() => void this.store.abrir(id));
    });
    effect(() => {
      const nombre = this.store.reporte()?.tablero.nombre;
      if (nombre) this.title.setTitle(`Reportes de ${nombre} — Corcho`);
    });
  }

  /** PDF: el diálogo de imprimir del navegador ("Guardar como PDF"), con estilos de impresión. */
  protected exportarPdf(): void {
    window.print();
  }
}
