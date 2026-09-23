import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Categoria, DatosCategoria } from '../../../../core/models';
import { Icono } from '../../../../shared/components/icono/icono';
import { FormularioCategoria } from '../formulario-categoria/formulario-categoria';

/**
 * Elegir la categoría de una nota (o ninguna) y crear una nueva sin salir del formulario.
 *   <app-selector-categoria formControlName="categoriaId" [categorias]="..." [crear]="crearCategoria" />
 */
@Component({
  selector: 'app-selector-categoria',
  imports: [Icono, FormularioCategoria],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectorCategoria), multi: true }],
  templateUrl: './selector-categoria.html',
  styleUrl: './selector-categoria.scss',
})
export class SelectorCategoria implements ControlValueAccessor {
  readonly categorias = input.required<Categoria[]>();
  /** Crea la categoría en el tablero y la devuelve (para dejarla elegida). */
  readonly crear = input.required<(datos: DatosCategoria) => Promise<Categoria>>();

  protected readonly valor = signal<string | null>(null);
  protected readonly creando = signal(false);
  private alCambiar: (valor: string | null) => void = () => {};
  private alTocar: () => void = () => {};

  /** Se le pasa al formulario de categoría: crea, la elige y cierra el mini formulario. */
  protected readonly crearYElegir = async (datos: DatosCategoria): Promise<void> => {
    const nueva = await this.crear()(datos);
    this.elegir(nueva.id);
    this.creando.set(false);
  };

  protected elegir(id: string | null): void {
    this.valor.set(id);
    this.alCambiar(id);
    this.alTocar();
  }

  writeValue(valor: string | null): void {
    this.valor.set(valor);
  }

  registerOnChange(fn: (valor: string | null) => void): void {
    this.alCambiar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocar = fn;
  }
}
