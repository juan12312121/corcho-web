import { Directive, ElementRef, inject, input, output } from '@angular/core';
import { Posicion } from '../../core/models';

/** Distancia mínima para considerar que es un arrastre y no un clic. */
const UMBRAL_PX = 4;

/**
 * Arrastrar con mouse, dedo o pluma (Pointer Events) dentro del contenedor posicionado.
 * No mueve nada por sí misma: emite posiciones y quien la usa decide qué hacer.
 *
 *   <div appArrastrable [posicion]="{posX, posY}" (moviendo)="..." (soltado)="..." (clic)="...">
 */
@Directive({
  selector: '[appArrastrable]',
  host: {
    '(pointerdown)': 'empezar($event)',
    '(pointermove)': 'mover($event)',
    '(pointerup)': 'terminar($event)',
    '(pointercancel)': 'cancelar()',
    '[style.touch-action]': "'none'",
    '[class.arrastrando]': 'arrastrando',
  },
})
export class ArrastrableDirective {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly posicion = input.required<Posicion>();
  readonly deshabilitado = input(false);

  readonly iniciado = output<void>();
  readonly moviendo = output<Posicion>();
  readonly soltado = output<Posicion>();
  /** Se soltó sin moverse: fue un clic. */
  readonly clic = output<void>();

  protected arrastrando = false;
  private inicio: { x: number; y: number; posX: number; posY: number } | null = null;
  private ultima: Posicion | null = null;

  protected empezar(evento: PointerEvent): void {
    if (this.deshabilitado() || evento.button !== 0) return;
    const { posX, posY } = this.posicion();
    this.inicio = { x: evento.clientX, y: evento.clientY, posX, posY };
    this.ultima = null;
    this.elemento.nativeElement.setPointerCapture(evento.pointerId);
  }

  protected mover(evento: PointerEvent): void {
    if (!this.inicio) return;
    const dx = evento.clientX - this.inicio.x;
    const dy = evento.clientY - this.inicio.y;
    if (!this.arrastrando && Math.hypot(dx, dy) < UMBRAL_PX) return;
    if (!this.arrastrando) {
      this.arrastrando = true;
      this.iniciado.emit();
    }
    this.ultima = { posX: Math.max(0, Math.round(this.inicio.posX + dx)), posY: Math.max(0, Math.round(this.inicio.posY + dy)) };
    this.moviendo.emit(this.ultima);
  }

  protected terminar(evento: PointerEvent): void {
    if (!this.inicio) return;
    this.elemento.nativeElement.releasePointerCapture(evento.pointerId);
    if (this.arrastrando && this.ultima) this.soltado.emit(this.ultima);
    else this.clic.emit();
    this.limpiar();
  }

  protected cancelar(): void {
    if (this.arrastrando && this.inicio) this.soltado.emit({ posX: this.inicio.posX, posY: this.inicio.posY });
    this.limpiar();
  }

  private limpiar(): void {
    this.inicio = null;
    this.ultima = null;
    this.arrastrando = false;
  }
}
