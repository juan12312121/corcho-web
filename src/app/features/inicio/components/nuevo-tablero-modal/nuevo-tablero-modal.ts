import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatosTablero, TipoTablero } from '../../../../core/models';
import { mensajeDeError } from '../../../../core/utils/errores';
import { Boton } from '../../../../shared/components/boton/boton';
import { Campo } from '../../../../shared/components/campo/campo';
import { ControlSegmentado, OpcionSegmento } from '../../../../shared/components/control-segmentado/control-segmentado';
import { Modal } from '../../../../shared/components/modal/modal';

/** Elegir personal o compartido, ponerle nombre y listo. */
@Component({
  selector: 'app-nuevo-tablero-modal',
  imports: [ReactiveFormsModule, Modal, Campo, Boton, ControlSegmentado],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nuevo-tablero-modal.html',
})
export class NuevoTableroModal {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly abierto = input(false);
  /** Lo que hace el padre al guardar; si falla, el error se muestra aquí. */
  readonly guardar = input.required<(datos: DatosTablero) => Promise<unknown>>();
  readonly cerrar = output<void>();

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly tipos: OpcionSegmento<TipoTablero>[] = [
    { valor: 'personal', etiqueta: 'Personal', icono: 'person', descripcion: 'Solo tú: tus gastos, recibos y lo que debes o te deben.' },
    { valor: 'compartido', etiqueta: 'Compartido', icono: 'groups', descripcion: 'Con familia o amigos: los gastos se reparten y todos lo ven en vivo.' },
  ];

  protected readonly formulario = this.fb.group({
    tipo: this.fb.control<TipoTablero>('compartido'),
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    descripcion: ['', Validators.maxLength(500)],
  });

  constructor() {
    // Cada vez que se abre, empieza limpio
    effect(() => {
      if (!this.abierto()) return;
      this.formulario.reset();
      this.error.set(null);
    });
  }

  protected async enviar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { tipo, nombre, descripcion } = this.formulario.getRawValue();
    this.enviando.set(true);
    this.error.set(null);
    try {
      await this.guardar()({ tipo, nombre: nombre.trim(), descripcion: descripcion.trim() || null });
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }

  protected errorNombre(): string | null {
    const control = this.formulario.controls.nombre;
    return control.touched && control.invalid ? 'Ponle un nombre (máximo 80 letras)' : null;
  }
}
