import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icono } from '../icono/icono';

export interface OpcionSegmento<T extends string = string> {
  valor: T;
  etiqueta: string;
  icono?: string;
  descripcion?: string;
}

/**
 * Botones de una sola elección ("Igual | Montos | % | Proporción").
 * Con `grande` muestra tarjetas con descripción (p. ej. Personal vs Compartido).
 * Funciona con formularios reactivos (formControlName).
 */
@Component({
  selector: 'app-control-segmentado',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ControlSegmentado), multi: true }],
  templateUrl: './control-segmentado.html',
  styleUrl: './control-segmentado.scss',
})
export class ControlSegmentado implements ControlValueAccessor {
  readonly opciones = input.required<OpcionSegmento[]>();
  readonly etiqueta = input.required<string>();
  readonly grande = input(false);

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
