import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Adjunto, Nota } from '../../../../core/models';
import { ArchivoInvalidoError } from '../../../../core/services/archivos/archivos.service';
import { mensajeDeError } from '../../../../core/utils/errores';
import { miniatura } from '../../../../core/utils/imagenes';
import { Boton } from '../../../../shared/components/boton/boton';
import { Icono } from '../../../../shared/components/icono/icono';
import { TableroStore } from '../../tablero.store';

const MAXIMO_FOTOS = 6;

/** Fotos del ticket o recibo de una nota: subir (directo a Cloudinary), ver en grande y quitar. */
@Component({
  selector: 'app-fotos-nota',
  imports: [Boton, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'ampliada.set(null)' },
  templateUrl: './fotos-nota.html',
  styleUrl: './fotos-nota.scss',
})
export class FotosNota {
  private readonly store = inject(TableroStore);

  readonly nota = input.required<Nota>();

  protected readonly subiendo = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly ampliada = signal<Adjunto | null>(null);

  protected readonly fotos = computed(() => this.nota().adjuntos ?? []);
  protected readonly caben = computed(() => MAXIMO_FOTOS - this.fotos().length);
  /** Un cuadro "cargando" por cada foto que va subiendo */
  protected readonly pendientes = computed(() => Array.from({ length: this.subiendo() }));
  protected readonly miniatura = miniatura;

  protected puedeQuitar(foto: Adjunto): boolean {
    return foto.subidoPor === this.store.yoId() || this.store.soyAdmin();
  }

  protected async elegir(evento: Event): Promise<void> {
    const campo = evento.target as HTMLInputElement;
    const archivos = [...(campo.files ?? [])].slice(0, this.caben());
    campo.value = '';
    this.error.set(null);
    await Promise.all(archivos.map((archivo) => this.subir(archivo)));
  }

  protected async quitar(foto: Adjunto): Promise<void> {
    this.error.set(null);
    try {
      await this.store.quitarFoto(this.nota().id, foto.id);
      if (this.ampliada()?.id === foto.id) this.ampliada.set(null);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    }
  }

  private async subir(archivo: File): Promise<void> {
    this.subiendo.update((n) => n + 1);
    try {
      await this.store.subirFoto(this.nota().id, archivo);
    } catch (e) {
      this.error.set(e instanceof ArchivoInvalidoError ? e.message : mensajeDeError(e));
    } finally {
      this.subiendo.update((n) => n - 1);
    }
  }
}
