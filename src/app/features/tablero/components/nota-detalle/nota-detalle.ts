import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Categoria, Miembro, Nota, PlanAMeses } from '../../../../core/models';
import { ChipCategoria } from '../../../../shared/components/chip-categoria/chip-categoria';
import { mensajeDeError } from '../../../../core/utils/errores';
import { Avatar } from '../../../../shared/components/avatar/avatar';
import { BarraProgreso } from '../../../../shared/components/barra-progreso/barra-progreso';
import { Boton } from '../../../../shared/components/boton/boton';
import { Etiqueta } from '../../../../shared/components/etiqueta/etiqueta';
import { Icono } from '../../../../shared/components/icono/icono';
import { Modal } from '../../../../shared/components/modal/modal';
import { Monto } from '../../../../shared/components/monto/monto';
import { ESTADOS_NOTA, RECURRENCIAS, TIPOS_NOTA } from '../../../../shared/constants/opciones';
import { FechaCortaPipe } from '../../../../shared/pipes/fecha-corta.pipe';
import { MonedaPipe } from '../../../../shared/pipes/moneda.pipe';
import { VencimientoPipe } from '../../../../shared/pipes/vencimiento.pipe';
import { ComentariosNota } from '../comentarios-nota/comentarios-nota';
import { FotosNota } from '../fotos-nota/fotos-nota';

/** Acciones que la página ejecuta; si fallan, el error se muestra dentro del detalle. */
export interface AccionesNota {
  pagar: (pagadoPor: string) => Promise<unknown>;
  abonar: (monto: number) => Promise<unknown>;
  borrar: () => Promise<unknown>;
  /** true = mandar al archivo; false = regresarla al corcho */
  archivar: (archivada: boolean) => Promise<unknown>;
}

/** Ver una nota completa y actuar sobre ella (pagar, abonar, editar, pagar mi parte, archivar, borrar), con fotos y comentarios. */
@Component({
  selector: 'app-nota-detalle',
  imports: [ChipCategoria, ComentariosNota, FotosNota, FormsModule, Icono, Modal, Boton, Etiqueta, Monto, Avatar, BarraProgreso, MonedaPipe, FechaCortaPipe, VencimientoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nota-detalle.html',
  styleUrl: './nota-detalle.scss',
})
export class NotaDetalle {
  readonly abierto = input(false);
  readonly nota = input.required<Nota | null>();
  readonly miembros = input.required<Map<string, Miembro>>();
  readonly categorias = input<Map<string, Categoria>>(new Map());
  /** Si la nota va a meses: su avance (compra o deuda). */
  readonly plan = input<PlanAMeses | null>(null);
  readonly moneda = input('MXN');
  readonly yoId = input.required<string>();
  readonly puedeEditar = input(false);
  readonly acciones = input.required<AccionesNota>();

  readonly cerrar = output<void>();
  readonly editar = output<Nota>();
  /** Registrar un pago mío a quien pagó la nota (mi parte, o una mensualidad si es deuda a meses). */
  readonly pagarMiParte = output<{ nota: Nota; monto: number }>();

  protected readonly ocupado = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmandoBorrado = signal(false);
  protected pagadoPor = '';
  protected montoAbono: number | null = null;

  protected readonly tipo = computed(() => TIPOS_NOTA[this.nota()?.tipo ?? 'gasto']);
  protected readonly estado = computed(() => ESTADOS_NOTA[this.nota()?.estado ?? 'pagada']);
  protected readonly recurrencia = computed(() => RECURRENCIAS.find((r) => r.valor === this.nota()?.recurrencia)?.etiqueta);
  protected readonly externa = computed(() => this.nota()?.contraparte != null);
  protected readonly categoria = computed(() => this.categorias().get(this.nota()?.categoriaId ?? '') ?? null);
  /** Lo que me toca pagar ahora: mi parte completa, o solo la mensualidad si la deuda va a meses. */
  protected readonly miPago = computed(() => {
    const parte = this.miParte();
    const plan = this.plan();
    if (!parte) return null;
    const esMensualidad = plan?.tipo === 'deuda' && !plan.liquidado;
    return { monto: esMensualidad ? Math.min(plan.mensualidad, plan.restante) : parte.monto, esMensualidad };
  });
  /** Ya no tiene nada pendiente: se puede quitar del corcho (el servidor lo vuelve a revisar). */
  protected readonly archivable = computed(() => {
    const n = this.nota();
    if (!n || n.archivada) return false;
    if (n.contraparte != null) return n.estado === 'liquidada';
    return n.estado !== 'por_pagar' && n.partes.every((p) => p.liquidada || p.usuarioId === n.pagadoPor);
  });
  protected readonly listaMiembros = computed(() => [...this.miembros().values()]);
  protected readonly partes = computed(() =>
    (this.nota()?.partes ?? []).map((p) => ({ ...p, miembro: this.miembros().get(p.usuarioId), esPagador: p.usuarioId === this.nota()?.pagadoPor })),
  );
  /** Mi parte pendiente en una nota que pagó otra persona. */
  protected readonly miParte = computed(() => {
    const n = this.nota();
    if (!n || n.estado !== 'pagada' || n.pagadoPor === this.yoId()) return null;
    return n.partes.find((p) => p.usuarioId === this.yoId() && !p.liquidada) ?? null;
  });

  constructor() {
    effect(() => {
      if (!this.abierto()) return;
      this.error.set(null);
      this.confirmandoBorrado.set(false);
      this.pagadoPor = this.yoId();
      this.montoAbono = null;
    });
  }

  /** En una deuda a meses con alguien de fuera, llena el abono con la mensualidad. */
  protected usarMensualidad(): void {
    const plan = this.plan();
    if (plan) this.montoAbono = Math.min(plan.mensualidad, plan.restante);
  }

  protected nombre(usuarioId: string | null | undefined): string {
    if (!usuarioId) return '—';
    if (usuarioId === this.yoId()) return 'Tú';
    const m = this.miembros().get(usuarioId);
    return m?.apodo || m?.nombre || 'Alguien';
  }

  protected pagar(): Promise<void> {
    return this.ejecutar(() => this.acciones().pagar(this.pagadoPor));
  }

  protected abonar(): Promise<void> {
    const monto = Number(this.montoAbono);
    if (!(monto > 0)) {
      this.error.set('Escribe cuánto abonaste');
      return Promise.resolve();
    }
    return this.ejecutar(async () => {
      await this.acciones().abonar(monto);
      this.montoAbono = null;
    });
  }

  protected archivar(archivada: boolean): Promise<void> {
    return this.ejecutar(() => this.acciones().archivar(archivada));
  }

  protected borrar(): Promise<void> {
    return this.ejecutar(() => this.acciones().borrar());
  }

  private async ejecutar(accion: () => Promise<unknown>): Promise<void> {
    this.ocupado.set(true);
    this.error.set(null);
    try {
      await accion();
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.ocupado.set(false);
    }
  }
}
