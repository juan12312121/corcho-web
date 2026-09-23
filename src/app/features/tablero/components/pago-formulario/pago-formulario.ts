import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { DatosPago, MetodoPago, Miembro } from '../../../../core/models';
import { mensajeDeError } from '../../../../core/utils/errores';
import { Avatar } from '../../../../shared/components/avatar/avatar';
import { Boton } from '../../../../shared/components/boton/boton';
import { Campo } from '../../../../shared/components/campo/campo';
import { ControlSegmentado } from '../../../../shared/components/control-segmentado/control-segmentado';
import { Icono } from '../../../../shared/components/icono/icono';
import { DatosTransferencia } from '../../../../shared/components/datos-transferencia/datos-transferencia';
import { Modal } from '../../../../shared/components/modal/modal';
import { METODOS_PAGO } from '../../../../shared/constants/opciones';
import { comisionTarjeta, MINIMO_CON_TARJETA } from '../../../../core/utils/comision';
import { MonedaPipe } from '../../../../shared/pipes/moneda.pipe';

/** Datos con los que se abre el formulario (desde una sugerencia o "pagar mi parte"). */
export interface PagoSugerido {
  deUsuarioId?: string;
  aUsuarioId?: string;
  monto?: number;
  notaId?: string;
  concepto?: string;
}

/** Registrar un pago entre miembros ("le pagué a Ana" o "Beto me pagó"). */
@Component({
  selector: 'app-pago-formulario',
  imports: [ReactiveFormsModule, Modal, Campo, Boton, ControlSegmentado, Avatar, Icono, DatosTransferencia, MonedaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pago-formulario.html',
  styleUrl: './pago-formulario.scss',
})
export class PagoFormulario {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly abierto = input(false);
  readonly sugerido = input<PagoSugerido | null>(null);
  readonly miembros = input<Miembro[]>([]);
  readonly yoId = input.required<string>();
  readonly moneda = input('MXN');
  readonly guardar = input.required<(datos: DatosPago) => Promise<unknown>>();
  /** Abre Stripe para pagar con tarjeta a quien recibe (solo si conectó su cuenta) */
  readonly pagarConTarjeta = input<(datos: { aUsuarioId: string; monto: number; notaId?: string; concepto?: string }) => Promise<unknown>>();
  readonly cerrar = output<void>();

  protected readonly metodos = METODOS_PAGO;
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    deUsuarioId: ['', Validators.required],
    aUsuarioId: ['', Validators.required],
    monto: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    metodo: this.fb.control<MetodoPago>('efectivo'),
    concepto: [''],
    notaId: [''],
  });

  private readonly valores = toSignal(this.formulario.valueChanges.pipe(map(() => this.formulario.getRawValue())), {
    initialValue: this.formulario.getRawValue(),
  });

  protected readonly de = computed(() => this.miembro(this.valores().deUsuarioId));
  protected readonly a = computed(() => this.miembro(this.valores().aUsuarioId));
  /** Si lo registro yo pagando, el otro tiene que confirmarlo. */
  protected readonly quedaPendiente = computed(() => this.valores().aUsuarioId !== this.yoId());
  /** Si yo pago y quien recibe dejó su CLABE en su perfil, se la muestro para transferirle. */
  protected readonly cuentaDestino = computed(() => {
    const a = this.a();
    return this.valores().deUsuarioId === this.yoId() && a?.clabe ? { ...a, nombre: this.nombre(a) } : null;
  });

  constructor() {
    effect(() => {
      if (!this.abierto()) return;
      const sugerido = this.sugerido();
      untracked(() => {
        this.error.set(null);
        this.formulario.reset({
          deUsuarioId: sugerido?.deUsuarioId ?? this.yoId(),
          aUsuarioId: sugerido?.aUsuarioId ?? '',
          monto: sugerido?.monto ?? null,
          metodo: 'efectivo',
          concepto: sugerido?.concepto ?? '',
          notaId: sugerido?.notaId ?? '',
        });
      });
    });
  }

  /** Pago con tarjeta disponible: yo pago y quien recibe ya puede cobrar con tarjeta */
  protected readonly tarjeta = computed(() => {
    const v = this.valores();
    const monto = Number(v.monto);
    if (!this.pagarConTarjeta() || v.deUsuarioId !== this.yoId() || !this.a()?.cobraConTarjeta || !(monto >= MINIMO_CON_TARJETA)) return null;
    return comisionTarjeta(monto);
  });
  protected readonly yendoAPagar = signal(false);

  protected async irAPagar(): Promise<void> {
    const v = this.formulario.getRawValue();
    this.yendoAPagar.set(true);
    this.error.set(null);
    try {
      await this.pagarConTarjeta()!({ aUsuarioId: v.aUsuarioId, monto: Number(v.monto), notaId: v.notaId || undefined, concepto: v.concepto.trim() || undefined });
    } catch (e) {
      this.error.set(mensajeDeError(e));
      this.yendoAPagar.set(false);
    }
  }

  protected nombre(m: Miembro): string {
    return m.usuarioId === this.yoId() ? 'Yo' : m.apodo || m.nombre;
  }

  protected async enviar(): Promise<void> {
    const v = this.formulario.getRawValue();
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Completa quién paga, a quién y cuánto');
      return;
    }
    if (v.deUsuarioId === v.aUsuarioId) {
      this.error.set('Quien paga y quien recibe deben ser distintos');
      return;
    }
    if (v.deUsuarioId !== this.yoId() && v.aUsuarioId !== this.yoId()) {
      this.error.set('Solo puedes registrar pagos donde tú pagas o recibes');
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    try {
      await this.guardar()({
        deUsuarioId: v.deUsuarioId,
        aUsuarioId: v.aUsuarioId,
        monto: Number(v.monto),
        metodo: v.metodo,
        concepto: v.concepto.trim() || null,
        notaId: v.notaId || undefined,
      });
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }

  private miembro(usuarioId: string | undefined): Miembro | undefined {
    return this.miembros().find((m) => m.usuarioId === usuarioId);
  }
}
