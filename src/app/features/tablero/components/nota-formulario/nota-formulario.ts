import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Categoria, ColorNota, DatosCategoria, DatosNota, Direccion, Miembro, ModoReparto, Nota, Participante, Recurrencia, TipoNota } from '../../../../core/models';
import { mensajeDeError } from '../../../../core/utils/errores';
import { hoyISO } from '../../../../core/utils/fechas';
import { mensualidades, previsualizarReparto } from '../../../../core/utils/reparto';
import { Avatar } from '../../../../shared/components/avatar/avatar';
import { Boton } from '../../../../shared/components/boton/boton';
import { Campo } from '../../../../shared/components/campo/campo';
import { ControlSegmentado } from '../../../../shared/components/control-segmentado/control-segmentado';
import { Modal } from '../../../../shared/components/modal/modal';
import { NotaAdhesiva } from '../../../../shared/components/nota-adhesiva/nota-adhesiva';
import { SelectorColor } from '../../../../shared/components/selector-color/selector-color';
import { COLORES_CHINCHE, COLORES_NOTA, MODOS_REPARTO, PLAZOS_MESES, RECURRENCIAS, TIPOS_NOTA } from '../../../../shared/constants/opciones';
import { SelectorCategoria } from '../selector-categoria/selector-categoria';
import { MonedaPipe } from '../../../../shared/pipes/moneda.pipe';
import { TipoCambioService } from '../../../../core/services/tipo-cambio/tipo-cambio.service';

/** Monedas que se ofrecen para "pagado en otra moneda" (todas tienen tipo de cambio en frankfurter.dev). */
const MONEDAS_EXTRANJERAS = ['USD', 'EUR', 'CAD', 'GBP', 'JPY', 'CHF', 'AUD', 'BRL', 'CNY', 'MXN'];

/** "Nadie aún" en el selector de quién pagó: la nota nace por pagar. */
const NADIE = '';

type FormParticipante = FormGroup<{
  usuarioId: FormControl<string>;
  incluido: FormControl<boolean>;
  valor: FormControl<number | null>;
}>;

/** Crear o editar una nota. Las reglas cambian según tablero (personal/compartido) y tipo. */
@Component({
  selector: 'app-nota-formulario',
  imports: [ReactiveFormsModule, Modal, Campo, Boton, ControlSegmentado, SelectorColor, NotaAdhesiva, Avatar, MonedaPipe, SelectorCategoria],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nota-formulario.html',
  styleUrl: './nota-formulario.scss',
})
export class NotaFormulario {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly tiposDeCambio = inject(TipoCambioService);

  readonly abierto = input(false);
  /** null = nota nueva */
  readonly nota = input<Nota | null>(null);
  readonly esPersonal = input(false);
  readonly miembros = input<Miembro[]>([]);
  readonly yoId = input.required<string>();
  readonly moneda = input('MXN');
  readonly categorias = input<Categoria[]>([]);
  readonly crearCategoria = input.required<(datos: DatosCategoria) => Promise<Categoria>>();
  readonly guardar = input.required<(datos: DatosNota) => Promise<unknown>>();
  readonly cerrar = output<void>();

  protected readonly coloresNota = COLORES_NOTA;
  protected readonly coloresChinche = COLORES_CHINCHE;
  protected readonly modosReparto = MODOS_REPARTO;
  protected readonly recurrencias = RECURRENCIAS;
  protected readonly plazos = PLAZOS_MESES;
  protected readonly nadie = NADIE;
  protected readonly buscandoCambio = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    tipo: this.fb.control<TipoNota>('gasto'),
    titulo: ['', [Validators.required, Validators.maxLength(120)]],
    monto: this.fb.control<number | null>(null),
    categoriaId: this.fb.control<string | null>(null),
    descripcion: [''],
    fecha: [hoyISO()],
    venceEn: [''],
    recurrencia: this.fb.control<Recurrencia>('ninguna'),
    pagadoPor: [''],
    modoReparto: this.fb.control<ModoReparto>('igual'),
    participantes: this.fb.array<FormParticipante>([]),
    contraparte: [''],
    direccion: this.fb.control<Direccion>('debo'),
    color: this.fb.control<ColorNota>('amarillo'),
    pinColor: ['rojo'],
    aMeses: [false],
    plazoMeses: [12, [Validators.min(2), Validators.max(60)]],
    otraMoneda: [false],
    monedaOriginal: ['USD'],
    montoOriginal: this.fb.control<number | null>(null),
    tipoCambio: this.fb.control<number | null>(null),
  });

  /**
   * El formulario como signal: la vista previa y las secciones visibles se recalculan solas.
   * getRawValue() incluye los controles deshabilitados (el tipo, al editar).
   */
  protected readonly valores = toSignal(this.formulario.valueChanges.pipe(map(() => this.formulario.getRawValue())), {
    initialValue: this.formulario.getRawValue(),
  });

  protected readonly editando = computed(() => this.nota() !== null);
  protected readonly tipo = computed(() => this.valores().tipo ?? 'gasto');
  protected readonly tipos = computed(() => Object.values(TIPOS_NOTA));
  protected readonly llevaMonto = computed(() => this.tipo() !== 'recordatorio');
  protected readonly esDeudaExterna = computed(() => this.esPersonal() && this.tipo() === 'prestamo');
  protected readonly seReparte = computed(() => !this.esPersonal() && this.llevaMonto());
  protected readonly titulo = computed(() => (this.editando() ? 'Editar nota' : 'Nueva nota'));

  // ---------- otra moneda ----------
  protected readonly monedasExtranjeras = computed(() => MONEDAS_EXTRANJERAS.filter((m) => m !== this.moneda()));
  protected readonly enOtraMoneda = computed(() => this.llevaMonto() && !this.esMensualidad() && !!this.valores().otraMoneda);
  /** El monto en la moneda del tablero (el servidor hace la misma cuenta). */
  protected readonly montoConvertido = computed(() => {
    const v = this.valores();
    const total = Math.round(Number(v.montoOriginal) * Number(v.tipoCambio) * 100) / 100;
    return total > 0 ? total : null;
  });

  // ---------- reparto por ingresos ----------
  /** Solo si todos los incluidos registraron su ingreso (en su perfil; los demás solo ven el %). */
  protected readonly puedeRepartirPorIngresos = computed(() => {
    const incluidos = (this.valores().participantes ?? []).filter((p) => p.incluido);
    return incluidos.length > 1 && incluidos.every((p) => this.miembroDe(p.usuarioId ?? '')?.pesoIngreso);
  });

  // ---------- a meses ----------
  /** Una mensualidad ya creada: su monto y plazo salen del plan y no se editan. */
  protected readonly esMensualidad = computed(() => this.nota()?.planId != null);
  protected readonly puedeIrAMeses = computed(() => this.llevaMonto() && !this.esMensualidad() && (!this.editando() || this.tipo() === 'prestamo'));
  protected readonly aMeses = computed(() => this.puedeIrAMeses() && !!this.valores().aMeses);
  /** Compra a meses (gasto/servicio): el monto es el TOTAL y se clava una nota por mensualidad. */
  protected readonly esCompraAMeses = computed(() => this.aMeses() && this.tipo() !== 'prestamo');
  protected readonly vistaMensualidades = computed(() => {
    const v = this.valores();
    const meses = Number(v.plazoMeses);
    if (!this.aMeses() || !(meses >= 2 && meses <= 60)) return null;
    const lista = mensualidades(this.enOtraMoneda() ? (this.montoConvertido() ?? 0) : Number(v.monto) || 0, meses);
    return { meses, primera: lista[0] ?? 0, ultima: lista.at(-1) ?? 0 };
  });

  /** Cuánto le toca a cada participante con lo que va escrito. */
  protected readonly vistaReparto = computed(() => {
    const v = this.valores();
    const incluidos = (v.participantes ?? []).filter((p) => p.incluido);
    // En una compra a meses se reparte cada mensualidad, no el total
    const monto = this.enOtraMoneda() ? (this.montoConvertido() ?? 0) : Number(v.monto) || 0;
    const base = this.vistaMensualidades() && this.esCompraAMeses() ? this.vistaMensualidades()!.primera : monto;
    const montos = previsualizarReparto(base, v.modoReparto ?? 'igual', incluidos.map((p) => this.aParticipante(p, v.modoReparto)));
    return new Map(incluidos.map((p, i) => [p.usuarioId ?? '', montos[i]]));
  });

  constructor() {
    // Al elegir otra moneda se sugiere el tipo de cambio del día (se puede corregir)
    this.formulario.controls.monedaOriginal.valueChanges.subscribe(() => void this.sugerirTipoCambio());
    this.formulario.controls.otraMoneda.valueChanges.subscribe((activa) => {
      if (activa && !this.formulario.controls.tipoCambio.value) void this.sugerirTipoCambio();
    });
    // Al abrir: formulario limpio (o con la nota a editar)
    effect(() => {
      if (!this.abierto()) return;
      const nota = this.nota();
      untracked(() => this.preparar(nota));
    });
  }

  protected get participantes(): FormArray<FormParticipante> {
    return this.formulario.controls.participantes;
  }

  protected miembroDe(usuarioId: string): Miembro | undefined {
    return this.miembros().find((m) => m.usuarioId === usuarioId);
  }

  /** Pone en "proporción" el porcentaje de ingreso de cada quien. */
  protected repartirPorIngresos(): void {
    this.formulario.controls.modoReparto.setValue('proporcion');
    for (const grupo of this.participantes.controls) {
      const peso = this.miembroDe(grupo.controls.usuarioId.value)?.pesoIngreso;
      if (grupo.controls.incluido.value && peso) grupo.controls.valor.setValue(peso);
    }
  }

  protected async sugerirTipoCambio(): Promise<void> {
    if (!this.formulario.controls.otraMoneda.value) return;
    this.buscandoCambio.set(true);
    const tasa = await this.tiposDeCambio.obtener(this.formulario.controls.monedaOriginal.value, this.moneda());
    this.buscandoCambio.set(false);
    if (tasa) this.formulario.controls.tipoCambio.setValue(Math.round(tasa * 10000) / 10000);
  }

  protected errorTitulo(): string | null {
    const c = this.formulario.controls.titulo;
    return c.touched && c.invalid ? 'Escribe un título' : null;
  }

  protected async enviar(): Promise<void> {
    this.formulario.markAllAsTouched();
    const problema = this.validar();
    if (problema) {
      this.error.set(problema);
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    try {
      await this.guardar()(this.aDatosNota());
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }

  // ---------- armado ----------

  private preparar(nota: Nota | null): void {
    this.error.set(null);
    this.participantes.clear();
    const partes = new Map(nota?.partes.map((p) => [p.usuarioId, p]) ?? []);
    for (const m of this.miembros()) {
      const parte = partes.get(m.usuarioId);
      this.participantes.push(
        this.fb.group({
          usuarioId: this.fb.control(m.usuarioId),
          incluido: this.fb.control<boolean>(nota ? partes.has(m.usuarioId) : true),
          valor: this.fb.control<number | null>(parte ? (parte.proporcion ?? parte.porcentaje ?? parte.monto) : null),
        }),
      );
    }
    this.formulario.reset({
      tipo: nota?.tipo ?? 'gasto',
      titulo: nota?.titulo ?? '',
      monto: nota?.monto ?? null,
      categoriaId: nota?.categoriaId ?? null,
      descripcion: nota?.descripcion ?? '',
      fecha: nota?.fecha ?? hoyISO(),
      venceEn: nota?.venceEn ?? '',
      recurrencia: nota?.recurrencia ?? 'ninguna',
      pagadoPor: nota ? (nota.pagadoPor ?? NADIE) : this.yoId(),
      modoReparto: nota?.modoReparto ?? 'igual',
      contraparte: nota?.contraparte ?? '',
      direccion: nota?.direccion ?? 'debo',
      color: nota?.color ?? 'amarillo',
      pinColor: nota?.pinColor ?? 'rojo',
      aMeses: !!nota?.plazoMeses,
      plazoMeses: nota?.plazoMeses ?? 12,
      otraMoneda: !!nota?.monedaOriginal,
      monedaOriginal: nota?.monedaOriginal ?? 'USD',
      montoOriginal: nota?.montoOriginal ?? null,
      tipoCambio: nota?.tipoCambio ?? null,
    }, { emitEvent: false });
    this.formulario.updateValueAndValidity();
    if (nota) this.formulario.controls.tipo.disable();
    else this.formulario.controls.tipo.enable();
    if (nota?.planId) this.formulario.controls.monto.disable();
    else this.formulario.controls.monto.enable();
  }

  /** Reglas que conviene avisar antes de ir al servidor. */
  private validar(): string | null {
    const v = this.formulario.getRawValue();
    if (this.formulario.controls.titulo.invalid) return 'Escribe un título';
    if (this.enOtraMoneda()) {
      if (!(Number(v.montoOriginal) > 0)) return `Escribe cuánto fue en ${v.monedaOriginal}`;
      if (!(Number(v.tipoCambio) > 0)) return 'Escribe el tipo de cambio';
    } else if (this.llevaMonto() && !(Number(v.monto) > 0)) return 'Escribe un monto mayor a cero';
    if (this.aMeses() && this.formulario.controls.plazoMeses.invalid) return 'El plazo va de 2 a 60 meses';
    if (this.esDeudaExterna() && !v.contraparte.trim()) return '¿Con quién es la deuda?';
    if (this.seReparte() && !v.participantes.some((p) => p.incluido)) return 'Elige al menos a una persona para repartir';
    return null;
  }

  /** Solo manda lo que aplica a este tipo de nota y tablero. */
  private aDatosNota(): DatosNota {
    const v = this.formulario.getRawValue();
    const datos: DatosNota = {
      titulo: v.titulo.trim(),
      descripcion: v.descripcion.trim() || null,
      categoriaId: v.categoriaId,
      fecha: v.fecha || undefined,
      venceEn: v.venceEn || null,
      recurrencia: v.recurrencia,
      color: v.color,
      pinColor: v.pinColor,
    };
    if (!this.editando()) datos.tipo = v.tipo;
    if (!this.llevaMonto()) return datos;

    if (this.enOtraMoneda()) {
      datos.monedaOriginal = v.monedaOriginal;
      datos.montoOriginal = Number(v.montoOriginal);
      datos.tipoCambio = Number(v.tipoCambio);
      datos.monto = this.montoConvertido() ?? undefined;
    } else if (!this.esMensualidad()) {
      datos.monto = Number(v.monto);
      if (this.nota()?.monedaOriginal) datos.monedaOriginal = null;
    }
    const plazo = this.plazoAEnviar(v.aMeses, Number(v.plazoMeses));
    if (plazo !== undefined) datos.plazoMeses = plazo;
    if (this.esDeudaExterna()) return { ...datos, contraparte: v.contraparte.trim(), direccion: v.direccion };
    if (this.esPersonal()) return datos;

    datos.modoReparto = v.modoReparto;
    datos.participantes = v.participantes.filter((p) => p.incluido).map((p) => this.aParticipante(p, v.modoReparto));
    const notaActual = this.nota();
    if (!notaActual) {
      if (v.pagadoPor === NADIE) datos.estado = 'por_pagar';
      else datos.pagadoPor = v.pagadoPor;
    } else if (notaActual.estado !== 'por_pagar' && v.pagadoPor && v.pagadoPor !== notaActual.pagadoPor) {
      datos.pagadoPor = v.pagadoPor;
    }
    return datos;
  }

  /** Nuevo: el plazo si va a meses. Editando un préstamo: el plazo nuevo o null para quitarlo, solo si cambió. */
  private plazoAEnviar(aMeses: boolean, plazo: number): number | null | undefined {
    if (!this.puedeIrAMeses()) return undefined;
    const nuevo = aMeses ? plazo : null;
    if (!this.editando()) return nuevo ?? undefined;
    return nuevo === (this.nota()?.plazoMeses ?? null) ? undefined : nuevo;
  }

  private aParticipante(p: { usuarioId?: string; valor?: number | null }, modo: ModoReparto | undefined): Participante {
    const usuarioId = p.usuarioId ?? '';
    const valor = Number(p.valor) || 0;
    if (modo === 'montos') return { usuarioId, monto: valor };
    if (modo === 'porcentaje') return { usuarioId, porcentaje: valor };
    if (modo === 'proporcion') return { usuarioId, proporcion: valor || 1 };
    return { usuarioId };
  }
}
