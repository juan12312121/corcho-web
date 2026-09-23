import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Categoria, DatosCategoria } from '../../../../core/models';
import { mensajeDeError } from '../../../../core/utils/errores';
import { Boton } from '../../../../shared/components/boton/boton';
import { ChipCategoria } from '../../../../shared/components/chip-categoria/chip-categoria';
import { Icono } from '../../../../shared/components/icono/icono';
import { SelectorColor } from '../../../../shared/components/selector-color/selector-color';
import { COLORES_CATEGORIA, ICONOS_CATEGORIA } from '../../../../shared/constants/opciones';

/**
 * Nombre + ícono + color de una categoría. Sirve para crear (sin `categoria`) o editar.
 * Recibe `guardar` como función: si falla, muestra el error aquí mismo.
 */
@Component({
  selector: 'app-formulario-categoria',
  imports: [ReactiveFormsModule, Boton, ChipCategoria, Icono, SelectorColor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './formulario-categoria.html',
  styleUrl: './formulario-categoria.scss',
})
export class FormularioCategoria {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly categoria = input<Categoria | null>(null);
  readonly guardar = input.required<(datos: DatosCategoria) => Promise<unknown>>();
  readonly cancelar = output<void>();

  protected readonly iconos = ICONOS_CATEGORIA;
  protected readonly colores = COLORES_CATEGORIA;
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(40)]],
    icono: ['sell'],
    color: [COLORES_CATEGORIA[0].valor],
  });
  /** Vista previa del chip mientras se elige. */
  protected readonly vista = toSignal(this.formulario.valueChanges.pipe(map(() => this.formulario.getRawValue())), {
    initialValue: this.formulario.getRawValue(),
  });

  constructor() {
    effect(() => {
      const c = this.categoria();
      this.formulario.reset(c ? { nombre: c.nombre, icono: c.icono, color: c.color } : undefined);
    });
  }

  protected async enviar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Ponle nombre (máximo 40 letras)');
      return;
    }
    const { nombre, icono, color } = this.formulario.getRawValue();
    this.enviando.set(true);
    this.error.set(null);
    try {
      await this.guardar()({ nombre: nombre.trim(), icono, color });
      if (!this.categoria()) this.formulario.reset();
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }
}
