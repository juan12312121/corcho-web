import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icono } from '../icono/icono';

export interface OpcionColor {
  valor: string;
  etiqueta: string;
  /** Variable CSS del color, p. ej. 'var(--nota-amarillo)' */
  css: string;
}

/**
 * Muestras de color seleccionables; funciona con formularios reactivos:
 *   <app-selector-color formControlName="color" [opciones]="coloresNota" />
 */
@Component({
  selector: 'app-selector-color',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectorColor), multi: true }],
  template: `
    <div class="muestras" role="radiogroup" [attr.aria-label]="etiqueta()">
      @for (opcion of opciones(); track opcion.valor) {
        <button type="button" role="radio" class="muestra" [class.chica]="chico()" [style.background]="opcion.css"
          [attr.aria-checked]="valor() === opcion.valor" [attr.aria-label]="opcion.etiqueta" [title]="opcion.etiqueta"
          [disabled]="deshabilitado()" (click)="elegir(opcion.valor)">
          @if (valor() === opcion.valor) {
            <app-icono nombre="check" [tamano]="chico() ? 14 : 18" />
          }
        </button>
      }
    </div>
  `,
  styles: `
    .muestras { display: flex; flex-wrap: wrap; gap: 8px; }
    .muestra {
      width: 34px; height: 34px; border-radius: 10px; border: 2px solid rgba(0, 0, 0, 0.08); cursor: pointer;
      display: grid; place-items: center; color: rgba(0, 0, 0, 0.7); transition: transform var(--transicion);
    }
    .muestra.chica { width: 26px; height: 26px; border-radius: 50%; color: #fff; }
    .muestra:hover { transform: scale(1.08); }
    .muestra[aria-checked='true'] { border-color: var(--tinta); box-shadow: 0 0 0 2px var(--fondo), 0 0 0 4px var(--tinta); }
  `,
})
export class SelectorColor implements ControlValueAccessor {
  readonly opciones = input.required<OpcionColor[]>();
  readonly etiqueta = input('Color');
  readonly chico = input(false);

  protected readonly valor = signal<string | null>(null);
  protected readonly deshabilitado = signal(false);
  private alCambiar: (valor: string) => void = () => {};
  private alTocar: () => void = () => {};

  protected elegir(valor: string): void {
    this.valor.set(valor);
    this.alCambiar(valor);
    this.alTocar();
  }

  writeValue(valor: string | null): void {
    this.valor.set(valor);
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.alCambiar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocar = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
  }
}
