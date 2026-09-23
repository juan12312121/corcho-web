import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Categoria, Miembro, Nota, Posicion } from '../../../../core/models';
import { ArrastrableDirective } from '../../../../shared/directives/arrastrable.directive';
import { NotaCorcho } from '../nota-corcho/nota-corcho';

export interface MovimientoNota {
  notaId: string;
  posicion: Posicion;
}

const ANCHO_MINIMO = 1100;
const ALTO_MINIMO = 720;
const MARGEN = 280;

/**
 * El corcho: coloca cada nota en su (posX, posY) y deja arrastrarlas.
 * El lienzo crece solo si alguien clava una nota más lejos.
 */
@Component({
  selector: 'app-corcho',
  imports: [NotaCorcho, ArrastrableDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './corcho.html',
  styleUrl: './corcho.scss',
})
export class Corcho {
  readonly notas = input.required<Nota[]>();
  readonly miembros = input.required<Map<string, Miembro>>();
  readonly categorias = input<Map<string, Categoria>>(new Map());
  readonly moneda = input('MXN');
  /** notaId → nombre de quien la mueve (otras personas) */
  readonly movidasPor = input<Record<string, string>>({});

  readonly moviendo = output<MovimientoNota>();
  readonly soltada = output<MovimientoNota>();
  readonly abrir = output<Nota>();

  protected readonly arrastrandoId = signal<string | null>(null);

  protected readonly tamano = computed(() => {
    const notas = this.notas();
    return {
      ancho: Math.max(ANCHO_MINIMO, ...notas.map((n) => n.posX + MARGEN)),
      alto: Math.max(ALTO_MINIMO, ...notas.map((n) => n.posY + MARGEN)),
    };
  });

  protected alMover(nota: Nota, posicion: Posicion): void {
    this.moviendo.emit({ notaId: nota.id, posicion });
  }

  protected alSoltar(nota: Nota, posicion: Posicion): void {
    this.arrastrandoId.set(null);
    this.soltada.emit({ notaId: nota.id, posicion });
  }

  /** Con teclado: Enter abre, flechas la mueven 10 px (accesible sin mouse). */
  protected alTeclear(evento: KeyboardEvent, nota: Nota): void {
    const pasos: Record<string, [number, number]> = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      this.abrir.emit(nota);
      return;
    }
    const paso = pasos[evento.key];
    if (!paso) return;
    evento.preventDefault();
    this.soltada.emit({ notaId: nota.id, posicion: { posX: Math.max(0, nota.posX + paso[0]), posY: Math.max(0, nota.posY + paso[1]) } });
  }
}
