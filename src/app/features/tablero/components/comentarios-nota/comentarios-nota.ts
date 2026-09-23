import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Comentario, Miembro } from '../../../../core/models';
import { mensajeDeError } from '../../../../core/utils/errores';
import { haceCuanto } from '../../../../core/utils/fechas';
import { normalizar } from '../../../../core/utils/textos';
import { Avatar } from '../../../../shared/components/avatar/avatar';
import { Boton } from '../../../../shared/components/boton/boton';
import { Icono } from '../../../../shared/components/icono/icono';
import { TableroStore } from '../../tablero.store';

/** Pedazo de un comentario: texto normal o una @mención resaltada. */
interface Trozo {
  texto: string;
  mencion: boolean;
}

const MAXIMO_SUGERENCIAS = 5;
/** "@be" justo antes del cursor (letras, números, guion bajo) */
const MENCION_EN_CURSO = /@([\p{L}\d_]*)$/u;

/** Conversación de una nota. Escribir "@" sugiere miembros y les llega un aviso en vivo. */
@Component({
  selector: 'app-comentarios-nota',
  imports: [Avatar, Boton, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comentarios-nota.html',
  styleUrl: './comentarios-nota.scss',
})
export class ComentariosNota {
  protected readonly store = inject(TableroStore);

  readonly notaId = input.required<string>();

  protected readonly texto = signal('');
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Lo que se escribió después de "@" (null = no se está mencionando) */
  protected readonly buscando = signal<string | null>(null);
  protected readonly resaltada = signal(0);
  /** Personas elegidas del autocompletado mientras se escribe */
  private readonly elegidas = signal<Miembro[]>([]);

  private readonly otros = computed(() => this.store.miembros().filter((m) => m.usuarioId !== this.store.yoId()));

  protected readonly sugerencias = computed(() => {
    const buscado = this.buscando();
    if (buscado === null) return [];
    const q = normalizar(buscado);
    return this.otros()
      .filter((m) => normalizar(this.nombre(m)).includes(q) || normalizar(m.nombre).includes(q))
      .slice(0, MAXIMO_SUGERENCIAS);
  });

  protected readonly lista = computed(() =>
    this.store.comentarios().map((c) => ({
      ...c,
      trozos: this.trocear(c),
      cuando: haceCuanto(c.creadoEn),
      persona: { nombre: c.autor ?? 'Alguien', color: c.color ?? '#74777f', avatarUrl: c.avatarUrl },
      puedoBorrar: c.usuarioId === this.store.yoId() || this.store.soyAdmin(),
      esMio: c.usuarioId === this.store.yoId(),
    })),
  );

  protected alEscribir(campo: HTMLTextAreaElement): void {
    this.texto.set(campo.value);
    const antes = campo.value.slice(0, campo.selectionStart ?? campo.value.length);
    const enCurso = MENCION_EN_CURSO.exec(antes);
    this.buscando.set(enCurso && this.otros().length ? enCurso[1] : null);
    this.resaltada.set(0);
  }

  protected alTeclear(evento: KeyboardEvent, campo: HTMLTextAreaElement): void {
    const opciones = this.sugerencias();
    if (opciones.length) {
      if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
        evento.preventDefault();
        const paso = evento.key === 'ArrowDown' ? 1 : -1;
        this.resaltada.set((this.resaltada() + paso + opciones.length) % opciones.length);
        return;
      }
      if (evento.key === 'Enter' || evento.key === 'Tab') {
        evento.preventDefault();
        this.mencionar(opciones[this.resaltada()], campo);
        return;
      }
      if (evento.key === 'Escape') {
        evento.stopPropagation();
        this.buscando.set(null);
        return;
      }
    }
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault();
      void this.enviar(campo);
    }
  }

  /** Cambia "@be" por "@Beto " y recuerda a quién se mencionó. */
  protected mencionar(miembro: Miembro, campo: HTMLTextAreaElement): void {
    const cursor = campo.selectionStart ?? campo.value.length;
    const antes = campo.value.slice(0, cursor).replace(MENCION_EN_CURSO, `@${this.nombre(miembro)} `);
    campo.value = antes + campo.value.slice(cursor);
    campo.setSelectionRange(antes.length, antes.length);
    campo.focus();
    this.texto.set(campo.value);
    this.buscando.set(null);
    this.elegidas.update((lista) => (lista.some((m) => m.usuarioId === miembro.usuarioId) ? lista : [...lista, miembro]));
  }

  protected async enviar(campo: HTMLTextAreaElement): Promise<void> {
    const texto = this.texto().trim();
    if (!texto || this.enviando()) return;
    // Solo cuentan las menciones que siguen en el texto (pudo borrarlas)
    const menciones = this.elegidas()
      .filter((m) => texto.includes(`@${this.nombre(m)}`))
      .map((m) => m.usuarioId);
    this.enviando.set(true);
    this.error.set(null);
    try {
      await this.store.comentar(this.notaId(), texto, menciones);
      campo.value = '';
      this.texto.set('');
      this.elegidas.set([]);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }

  protected async borrar(comentario: Comentario): Promise<void> {
    try {
      await this.store.borrarComentario(this.notaId(), comentario.id);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    }
  }

  protected nombre(m: Miembro): string {
    return m.apodo || m.nombre;
  }

  /** Separa el texto para resaltar "@Nombre" de quienes sí fueron mencionados. */
  private trocear(c: Comentario): Trozo[] {
    const nombres = c.menciones
      .map((id) => this.store.miembro(id))
      .flatMap((m) => (m ? [...new Set([this.nombre(m), m.nombre])] : []))
      .sort((a, b) => b.length - a.length)
      .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!nombres.length) return [{ texto: c.texto, mencion: false }];
    // Con grupo de captura, split deja las menciones en las posiciones impares
    return c.texto
      .split(new RegExp(`(@(?:${nombres.join('|')}))`, 'g'))
      .map((texto, i) => ({ texto, mencion: i % 2 === 1 }))
      .filter((t) => t.texto);
  }
}
