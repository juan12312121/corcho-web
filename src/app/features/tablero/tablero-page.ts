import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BalanceCompartido, DatosCategoria, DatosNota, DatosPago, Nota, Pago, ResumenPersonal, Transferencia } from '../../core/models';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { mensajeDeError } from '../../core/utils/errores';
import { Boton } from '../../shared/components/boton/boton';
import { Cargando } from '../../shared/components/cargando/cargando';
import { DialogoConfirmacion } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';
import { Icono } from '../../shared/components/icono/icono';
import { BarraTablero } from './components/barra-tablero/barra-tablero';
import { Corcho, MovimientoNota } from './components/corcho/corcho';
import { InvitarModal } from './components/invitar-modal/invitar-modal';
import { AccionesNota, NotaDetalle } from './components/nota-detalle/nota-detalle';
import { NotaFormulario } from './components/nota-formulario/nota-formulario';
import { PagoFormulario, PagoSugerido } from './components/pago-formulario/pago-formulario';
import { PanelCompartido } from './components/panel-compartido/panel-compartido';
import { PanelPersonal } from './components/panel-personal/panel-personal';
import { CategoriasModal } from './components/categorias-modal/categorias-modal';
import { AvancePresupuestos } from './components/avance-presupuestos/avance-presupuestos';
import { TableroStore } from './tablero.store';

type Confirmacion = 'compartir' | 'salir' | 'borrar';

/** Columnas y separación para acomodar notas nuevas sin encimarlas. */
const COLUMNAS = 4;
const PASO_X = 250;
const PASO_Y = 260;

/**
 * Página del tablero: conecta el store con los componentes y abre/cierra modales.
 * No tiene lógica de negocio: eso vive en el store (y en el backend).
 */
@Component({
  selector: 'app-tablero-page',
  imports: [
    Boton, Cargando, EstadoVacio, Icono, DialogoConfirmacion, BarraTablero, Corcho, PanelCompartido, PanelPersonal,
    NotaFormulario, NotaDetalle, PagoFormulario, InvitarModal, CategoriasModal, AvancePresupuestos,
  ],
  providers: [TableroStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tablero-page.html',
  styleUrl: './tablero-page.scss',
})
export class TableroPage {
  protected readonly store = inject(TableroStore);
  private readonly avisos = inject(AvisosService);
  private readonly title = inject(Title);

  /** :tableroId de la ruta (withComponentInputBinding) */
  readonly tableroId = input.required<string>();

  // ---------- modales ----------
  protected readonly formularioAbierto = signal(false);
  protected readonly notaEnEdicion = signal<Nota | null>(null);
  protected readonly notaAbiertaId = signal<string | null>(null);
  protected readonly pagoAbierto = signal(false);
  protected readonly pagoSugerido = signal<PagoSugerido | null>(null);
  protected readonly invitarAbierto = signal(false);
  protected readonly categoriasAbierto = signal(false);
  protected readonly confirmacion = signal<Confirmacion | null>(null);

  /** La nota abierta se lee del store: si cambia en vivo, el detalle se actualiza solo. */
  protected readonly notaAbierta = computed(() => this.store.buscarNota(this.notaAbiertaId()));
  /** Avance a meses de la nota abierta (compra: por planId; deuda: la propia nota). */
  protected readonly planNotaAbierta = computed(() => {
    const nota = this.notaAbierta();
    if (!nota?.plazoMeses) return null;
    return this.store.planes().find((p) => p.planId === (nota.planId ?? nota.id)) ?? null;
  });
  protected readonly puedeEditarNotaAbierta = computed(() => {
    const nota = this.notaAbierta();
    return !!nota && (nota.creadoPor === this.store.yoId() || this.store.soyAdmin());
  });
  protected readonly balanceCompartido = computed(() => {
    const b = this.store.balance();
    return b?.tipo === 'compartido' ? (b as BalanceCompartido) : null;
  });
  protected readonly resumenPersonal = computed(() => {
    const b = this.store.balance();
    return b?.tipo === 'personal' ? (b as ResumenPersonal) : null;
  });
  /** Nada que mostrar por la búsqueda o el archivo vacío (el corcho vacío tiene su propio mensaje). */
  protected readonly sinResultados = computed(
    () => !this.store.notasVisibles().length && (this.store.verArchivo() || !!this.store.busqueda().trim()) && !this.store.cargandoArchivo(),
  );
  protected readonly movidasPor = computed(() =>
    Object.fromEntries(Object.entries(this.store.arrastresAjenos()).map(([notaId, a]) => [notaId, this.store.nombreDe(a.usuarioId)])),
  );

  protected readonly textosConfirmacion: Record<Confirmacion, { titulo: string; mensaje: string; boton: string }> = {
    compartir: {
      titulo: 'Convertir en compartido',
      mensaje: 'Podrás invitar a familia o amigos y repartir gastos. Tus notas actuales se quedan como están.',
      boton: 'Convertir',
    },
    salir: {
      titulo: 'Salir del tablero',
      mensaje: 'Dejarás de ver este tablero. Solo puedes salir si estás a mano con todos.',
      boton: 'Salir',
    },
    borrar: {
      titulo: 'Borrar tablero',
      mensaje: 'Se borran todas sus notas, pagos e historial para todos los miembros. No se puede deshacer.',
      boton: 'Borrar para siempre',
    },
  };

  constructor() {
    this.store.escucharEnVivo();
    effect(() => {
      const id = this.tableroId();
      untracked(() => void this.store.abrir(id));
    });
    effect(() => {
      const notaId = this.notaAbiertaId();
      untracked(() => void this.store.cargarComentarios(notaId).catch((e) => this.avisos.error(mensajeDeError(e))));
    });
    effect(() => {
      const nombre = this.store.tablero()?.nombre;
      if (nombre) this.title.setTitle(`${nombre} — Corcho`);
    });
  }

  // ---------- corcho ----------

  protected alMover({ notaId, posicion }: MovimientoNota): void {
    this.store.arrastrarNota(notaId, posicion);
  }

  protected alSoltar({ notaId, posicion }: MovimientoNota): void {
    void this.store.soltarNota(notaId, posicion);
  }

  protected abrirNota(nota: Nota): void {
    this.notaAbiertaId.set(nota.id);
  }

  // ---------- notas ----------

  protected nuevaNota(): void {
    this.notaEnEdicion.set(null);
    this.formularioAbierto.set(true);
  }

  protected editarNota(nota: Nota): void {
    this.notaAbiertaId.set(null);
    this.notaEnEdicion.set(nota);
    this.formularioAbierto.set(true);
  }

  protected readonly guardarNota = async (datos: DatosNota): Promise<void> => {
    const enEdicion = this.notaEnEdicion();
    if (enEdicion) await this.store.editarNota(enEdicion.id, datos);
    else await this.store.crearNota({ ...datos, ...this.lugarLibre() });
    this.formularioAbierto.set(false);
    this.avisos.exito(enEdicion ? 'Nota actualizada' : 'Nota clavada en el corcho');
  };

  /** El formulario de nota puede crear categorías al vuelo. */
  protected readonly crearCategoria = (datos: DatosCategoria) => this.store.crearCategoria(datos);

  protected readonly accionesNota: AccionesNota = {
    pagar: async (pagadoPor) => {
      const id = this.notaAbiertaId();
      if (id) await this.store.pagarNota(id, pagadoPor);
      this.avisos.exito('Listo, quedó registrada');
    },
    abonar: async (monto) => {
      const id = this.notaAbiertaId();
      if (id) await this.store.abonar(id, monto);
      this.avisos.exito('Abono registrado');
    },
    archivar: async (archivada) => {
      const id = this.notaAbiertaId();
      if (id) await this.store.archivarNota(id, archivada);
      this.notaAbiertaId.set(null);
      this.avisos.info(archivada ? 'Nota archivada; la encuentras en el archivo' : 'Nota de regreso en el corcho');
    },
    borrar: async () => {
      const id = this.notaAbiertaId();
      if (id) await this.store.borrarNota(id);
      this.notaAbiertaId.set(null);
      this.avisos.info('Nota quitada');
    },
  };

  protected async archivarSaldadas(): Promise<void> {
    try {
      const cuantas = await this.store.archivarSaldadas();
      this.avisos.info(cuantas ? `${cuantas} ${cuantas === 1 ? 'nota saldada se fue' : 'notas saldadas se fueron'} al archivo` : 'No hay notas saldadas por archivar');
    } catch (e) {
      this.avisos.error(mensajeDeError(e));
    }
  }

  // ---------- pagos ----------

  protected pagarSugerencia(t: Transferencia): void {
    this.abrirPago({ deUsuarioId: t.de, aUsuarioId: t.a, monto: t.monto, concepto: 'Para quedar a mano' });
  }

  protected pagarMiParte({ nota, monto }: { nota: Nota; monto: number }): void {
    this.notaAbiertaId.set(null);
    const concepto = nota.plazoMeses ? `Mensualidad de ${nota.titulo}` : `Mi parte de ${nota.titulo}`;
    this.abrirPago({ deUsuarioId: this.store.yoId(), aUsuarioId: nota.pagadoPor ?? undefined, monto, notaId: nota.id, concepto });
  }

  protected readonly guardarPago = async (datos: DatosPago): Promise<void> => {
    const pago = await this.store.registrarPago(datos);
    this.pagoAbierto.set(false);
    this.avisos.exito(pago.estado === 'confirmado' ? 'Pago registrado' : `Pago enviado; ${this.store.nombreDe(pago.aUsuarioId)} debe confirmarlo`);
  };

  protected async decidirPago(pago: Pago, confirmar: boolean): Promise<void> {
    try {
      if (confirmar) await this.store.confirmarPago(pago.id);
      else await this.store.rechazarPago(pago.id);
      this.avisos.exito(confirmar ? 'Pago confirmado' : 'Pago rechazado');
    } catch (e) {
      this.avisos.error(mensajeDeError(e));
    }
  }

  // ---------- tablero ----------

  protected readonly ejecutarConfirmacion = async (): Promise<void> => {
    const accion = this.confirmacion();
    if (accion === 'compartir') {
      await this.store.cambiarTipo('compartido');
      this.avisos.exito('Ahora es compartido: ya puedes invitar');
      this.invitarAbierto.set(true);
    }
    if (accion === 'salir') await this.store.salirme();
    if (accion === 'borrar') await this.store.borrarTablero();
  };

  private abrirPago(sugerido: PagoSugerido): void {
    this.pagoSugerido.set(sugerido);
    this.pagoAbierto.set(true);
  }

  /** Siguiente hueco en una rejilla de 4 columnas, para no encimar notas nuevas. */
  private lugarLibre(): { posX: number; posY: number } {
    const i = this.store.notas().length;
    return { posX: 40 + (i % COLUMNAS) * PASO_X, posY: 40 + Math.floor(i / COLUMNAS) * PASO_Y };
  }
}
