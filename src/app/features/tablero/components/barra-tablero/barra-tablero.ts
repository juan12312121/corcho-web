import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, model, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Miembro, TableroDetalle } from '../../../../core/models';
import { Boton } from '../../../../shared/components/boton/boton';
import { Etiqueta } from '../../../../shared/components/etiqueta/etiqueta';
import { GrupoAvatares } from '../../../../shared/components/grupo-avatares/grupo-avatares';
import { Icono } from '../../../../shared/components/icono/icono';
import { FiltroNotas } from '../../tablero.store';

/** Barra superior del tablero: nombre, tipo, quién está, filtros y acciones. */
@Component({
  selector: 'app-barra-tablero',
  imports: [RouterLink, Boton, Etiqueta, GrupoAvatares, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'menuAbierto.set(false)',
    '(document:click)': 'cerrarMenuSiEsFuera($event)',
  },
  templateUrl: './barra-tablero.html',
  styleUrl: './barra-tablero.scss',
})
export class BarraTablero {
  readonly tablero = input.required<TableroDetalle>();
  readonly miembros = input<Miembro[]>([]);
  readonly presentes = input<string[]>([]);
  readonly contadores = input.required<{ todas: number; porPagar: number; pagadas: number }>();
  readonly soyAdmin = input(false);
  readonly soyPropietario = input(false);
  /** Filtro de notas; bidireccional: [(filtro)] */
  readonly filtro = model<FiltroNotas>('todas');
  /** Texto de búsqueda; bidireccional: [(busqueda)] */
  readonly busqueda = model('');
  /** true = se está viendo el archivo; bidireccional: [(verArchivo)] */
  readonly verArchivo = model(false);

  readonly invitar = output<void>();
  readonly compartir = output<void>();
  readonly salir = output<void>();
  readonly borrar = output<void>();
  readonly categorias = output<void>();
  readonly archivarSaldadas = output<void>();

  protected readonly menuAbierto = signal(false);
  protected readonly esPersonal = computed(() => this.tablero().tipo === 'personal');
  protected readonly filtros = computed(() => [
    { valor: 'todas' as const, etiqueta: 'Todas', icono: 'grid_view', cuenta: this.contadores().todas },
    { valor: 'por_pagar' as const, etiqueta: 'Por pagar', icono: 'schedule', cuenta: this.contadores().porPagar },
    { valor: 'pagadas' as const, etiqueta: 'Pagadas', icono: 'task_alt', cuenta: this.contadores().pagadas },
  ]);

  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  protected cerrarMenuSiEsFuera(evento: MouseEvent): void {
    const menu = this.elemento.nativeElement.querySelector('.menu');
    if (this.menuAbierto() && menu && !menu.contains(evento.target as Node)) this.menuAbierto.set(false);
  }

  protected elegir(accion: 'compartir' | 'salir' | 'borrar' | 'categorias' | 'archivarSaldadas'): void {
    this.menuAbierto.set(false);
    this[accion].emit();
  }
}
