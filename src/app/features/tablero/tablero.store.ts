import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { merge, Observable } from 'rxjs';
import {
  Balance,
  Adjunto,
  AvancePresupuesto,
  Categoria,
  Comentario,
  DatosCategoria,
  DatosIngreso,
  DatosMeta,
  DatosNota,
  Ingreso,
  Meta,
  Movimiento,
  ResultadoImportacion,
  DatosInvitacion,
  DatosPago,
  Invitacion,
  Miembro,
  Nota,
  Pago,
  Posicion,
  TableroDetalle,
  TipoTablero,
} from '../../core/models';
import { ArchivosService } from '../../core/services/archivos/archivos.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { BalanceService } from '../../core/services/balance/balance.service';
import { CategoriasService } from '../../core/services/categorias/categorias.service';
import { ComentariosService } from '../../core/services/comentarios/comentarios.service';
import { PresupuestosService } from '../../core/services/presupuestos/presupuestos.service';
import { IngresosService } from '../../core/services/ingresos/ingresos.service';
import { CobrosService } from '../../core/services/cobros/cobros.service';
import { MetasService } from '../../core/services/metas/metas.service';
import { InvitacionesService } from '../../core/services/invitaciones/invitaciones.service';
import { MiembrosService } from '../../core/services/miembros/miembros.service';
import { NotasService } from '../../core/services/notas/notas.service';
import { PagosService } from '../../core/services/pagos/pagos.service';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { TablerosService } from '../../core/services/tableros/tableros.service';
import { TiempoRealService } from '../../core/services/tiempo-real/tiempo-real.service';
import { mensajeDeError } from '../../core/utils/errores';
import { normalizar } from '../../core/utils/textos';

export type FiltroNotas = 'todas' | 'por_pagar' | 'pagadas';

/** Posición de una nota que alguien más está arrastrando en este momento. */
interface ArrastreAjeno extends Posicion {
  usuarioId: string;
}

const ESPERA_BALANCE_MS = 250;
const INTERVALO_ARRASTRE_MS = 60;
const ARRASTRE_CADUCA_MS = 4000;

/**
 * Estado de UN tablero abierto. Se provee en TableroPage (nace y muere con ella).
 * - Carga tablero, notas, balance y pagos.
 * - Se suscribe a los eventos en vivo del tablero y los aplica.
 * - Expone acciones; los componentes nunca llaman servicios HTTP directamente.
 */
@Injectable()
export class TableroStore {
  private readonly tableros = inject(TablerosService);
  private readonly notasApi = inject(NotasService);
  private readonly pagosApi = inject(PagosService);
  private readonly balanceApi = inject(BalanceService);
  private readonly miembrosApi = inject(MiembrosService);
  private readonly invitacionesApi = inject(InvitacionesService);
  private readonly categoriasApi = inject(CategoriasService);
  private readonly presupuestosApi = inject(PresupuestosService);
  private readonly comentariosApi = inject(ComentariosService);
  private readonly archivosApi = inject(ArchivosService);
  private readonly ingresosApi = inject(IngresosService);
  private readonly metasApi = inject(MetasService);
  private readonly cobrosApi = inject(CobrosService);
  private readonly tiempoReal = inject(TiempoRealService);
  private readonly sesion = inject(SesionService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // ---------- estado ----------
  readonly tablero = signal<TableroDetalle | null>(null);
  readonly notas = signal<Nota[]>([]);
  readonly balance = signal<Balance | null>(null);
  readonly pagos = signal<Pago[]>([]);
  readonly presentes = signal<string[]>([]);
  readonly invitaciones = signal<Invitacion[]>([]);
  readonly categorias = signal<Categoria[]>([]);
  readonly arrastresAjenos = signal<Record<string, ArrastreAjeno>>({});
  readonly filtro = signal<FiltroNotas>('todas');
  readonly busqueda = signal('');
  /** true = el corcho muestra el archivo (notas saldadas que se quitaron) */
  readonly verArchivo = signal(false);
  readonly archivadas = signal<Nota[]>([]);
  readonly cargandoArchivo = signal(false);
  /** Metas de ahorro del tablero */
  readonly metas = signal<Meta[]>([]);
  /** Ingresos (solo tablero personal) */
  readonly ingresos = signal<Ingreso[]>([]);
  /** Comentarios de la nota abierta en el detalle */
  readonly comentarios = signal<Comentario[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  // ---------- derivados ----------
  readonly yoId = computed(() => this.sesion.usuario()?.id ?? '');
  readonly esPersonal = computed(() => this.tablero()?.tipo === 'personal');
  readonly moneda = computed(() => this.tablero()?.moneda ?? 'MXN');
  readonly miRol = computed(() => this.tablero()?.miRol ?? 'miembro');
  readonly soyAdmin = computed(() => this.miRol() !== 'miembro');
  readonly soyPropietario = computed(() => this.miRol() === 'propietario');
  readonly miembros = computed(() => this.tablero()?.miembros ?? []);
  readonly miembrosPorId = computed(() => new Map(this.miembros().map((m) => [m.usuarioId, m])));
  readonly categoriasPorId = computed(() => new Map(this.categorias().map((c) => [c.id, c])));
  /** Compras y deudas a meses del tablero (vienen calculadas en el balance). */
  readonly planes = computed(() => this.balance()?.planes ?? []);
  readonly planesPorNota = computed(() => new Map(this.planes().map((p) => [p.notaId, p])));
  /** Avance del mes de cada presupuesto (viene calculado en el balance). */
  readonly presupuestos = computed(() => this.balance()?.presupuestos ?? []);
  readonly presupuestosPorCategoria = computed(() => new Map(this.presupuestos().map((p) => [p.categoriaId, p])));

  /** Lo que se está viendo: el corcho o el archivo, ya con la búsqueda aplicada. */
  private readonly enVista = computed(() => {
    const texto = normalizar(this.busqueda().trim());
    const fuente = this.verArchivo() ? this.archivadas() : this.notas();
    return texto ? fuente.filter((n) => this.coincide(n, texto)) : fuente;
  });

  readonly contadores = computed(() => {
    const notas = this.enVista();
    return {
      todas: notas.length,
      porPagar: notas.filter((n) => n.estado === 'por_pagar').length,
      pagadas: notas.filter((n) => n.estado !== 'por_pagar').length,
    };
  });

  /** Lo que se pinta en el corcho: filtradas y con la posición en vivo de lo que otros arrastran. */
  readonly notasVisibles = computed(() => {
    const ajenos = this.arrastresAjenos();
    return this.enVista()
      .filter((n) => this.pasaFiltro(n))
      .map((n) => (ajenos[n.id] ? { ...n, posX: ajenos[n.id].posX, posY: ajenos[n.id].posY } : n));
  });

  /**
   * Lo que me toca pagar en el plan para quedar a mano ("pagar todo lo que debo"),
   * menos lo que ya mandé y sigue pendiente de confirmar (la misma cuenta que hace el servidor).
   */
  readonly misPagosSugeridos = computed(() => {
    const b = this.balance();
    if (b?.tipo !== 'compartido') return [];
    const enCamino = (a: string) =>
      this.pagos()
        .filter((p) => p.estado === 'pendiente' && p.deUsuarioId === this.yoId() && p.aUsuarioId === a)
        .reduce((t, p) => t + Math.round(p.monto * 100), 0);
    return b.sugerencias
      .filter((s) => s.de === this.yoId())
      .map((s) => ({ ...s, monto: (Math.round(s.monto * 100) - enCamino(s.a)) / 100 }))
      .filter((s) => s.monto > 0);
  });

  /** Pagos que otros me registraron y esperan que yo confirme. */
  readonly pagosPorConfirmar = computed(() => this.pagos().filter((p) => p.estado === 'pendiente' && p.aUsuarioId === this.yoId()));

  private tableroId = '';
  private notaComentada: string | null = null;
  private temporizadorBalance: ReturnType<typeof setTimeout> | undefined;
  private ultimoArrastre = 0;
  private readonly caducidades = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.tableroId) this.tiempoReal.salir(this.tableroId);
      clearTimeout(this.temporizadorBalance);
      this.caducidades.forEach(clearTimeout);
    });
  }

  // =====================================================================
  // Carga y tiempo real
  // =====================================================================

  async abrir(tableroId: string): Promise<void> {
    if (this.tableroId && this.tableroId !== tableroId) this.tiempoReal.salir(this.tableroId);
    this.tableroId = tableroId;
    this.cargando.set(true);
    this.error.set(null);
    try {
      const [tablero, notas, balance, categorias] = await Promise.all([
        this.tableros.obtener(tableroId),
        this.notasApi.listar(tableroId),
        this.balanceApi.obtener(tableroId),
        this.categoriasApi.listar(tableroId),
      ]);
      this.tablero.set(tablero);
      this.categorias.set(categorias);
      this.notas.set(notas);
      this.balance.set(balance);
      if (this.verArchivo()) void this.cargarArchivo();
      void this.cargarFinanzas(tablero.tipo === 'personal');
      if (tablero.tipo === 'compartido') this.pagos.set(await this.pagosApi.listar(tableroId));
      // El cuarto en vivo no bloquea la carga: si el socket tarda, el tablero ya se ve
      void this.tiempoReal.unirse(tableroId).then((presentes) => this.presentes.set(presentes));
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  /** Se llama una vez: conecta cada evento del servidor con su efecto en el estado. */
  escucharEnVivo(): void {
    const tr = this.tiempoReal;
    const alTablero = <T>(fuente: Observable<T>) => fuente.pipe(takeUntilDestroyed(this.destroyRef));

    alTablero(merge(tr.escuchar('nota:creada'), tr.escuchar('nota:actualizada'))).subscribe((nota) => {
      this.ponerNota(nota);
      this.refrescarResumenSi(nota);
    });
    alTablero(tr.escuchar('nota:borrada')).subscribe(({ id }) => {
      const previa = this.notas().find((n) => n.id === id);
      this.quitarNota(id);
      this.refrescarResumenSi(previa);
    });
    alTablero(tr.escuchar('nota:movida')).subscribe((pos) => {
      this.soltarAjeno(pos.id);
      this.notas.update((notas) => notas.map((n) => (n.id === pos.id ? { ...n, ...pos } : n)));
    });
    alTablero(tr.escuchar('nota:arrastrando')).subscribe(({ notaId, posX, posY, usuarioId }) => {
      this.arrastresAjenos.update((a) => ({ ...a, [notaId]: { posX, posY, usuarioId } }));
      this.caducarArrastre(notaId);
    });

    alTablero(merge(tr.escuchar('pago:creado'), tr.escuchar('pago:actualizado'))).subscribe((pago) => this.ponerPago(pago));
    alTablero(tr.escuchar('pago:borrado')).subscribe(({ id }) => this.pagos.update((p) => p.filter((x) => x.id !== id)));
    alTablero(tr.escuchar('pago:por_confirmar')).subscribe((pago) => {
      if (pago.tableroId === this.tableroId) this.avisos.info(`${this.nombreDe(pago.deUsuarioId)} registró un pago; confírmalo`);
    });

    // El contador de la nota solo lo mueven los eventos (también me llegan los míos): así no se cuenta doble
    alTablero(tr.escuchar('comentario:nuevo')).subscribe((c) => {
      if (c.notaId === this.notaComentada) this.ponerComentario(c);
      this.contarComentario(c.notaId, +1);
    });
    alTablero(tr.escuchar('comentario:borrado')).subscribe(({ id, notaId }) => {
      this.comentarios.update((lista) => lista.filter((c) => c.id !== id));
      this.contarComentario(notaId, -1);
    });

    alTablero(tr.escuchar('balance:cambio')).subscribe(() => {
      this.refrescarBalance();
      // Un ingreso nuevo (desde otra pestaña) también llega como balance:cambio
      if (this.esPersonal()) void this.cargarFinanzas(true);
    });
    alTablero(tr.escuchar('meta:actualizada')).subscribe((meta) => this.ponerMeta(meta));
    alTablero(tr.escuchar('meta:borrada')).subscribe(({ id }) => this.metas.update((lista) => lista.filter((m) => m.id !== id)));
    alTablero(tr.escuchar('notas:importadas')).subscribe(() => void this.recargarNotas());
    alTablero(tr.escuchar('categoria:guardada')).subscribe((c) => this.ponerCategoria(c));
    alTablero(tr.escuchar('categoria:borrada')).subscribe(({ id }) => {
      this.categorias.update((lista) => lista.filter((c) => c.id !== id));
      this.notas.update((notas) => notas.map((n) => (n.categoriaId === id ? { ...n, categoriaId: null } : n)));
      this.refrescarResumenSi();
    });
    alTablero(tr.escuchar('presencia')).subscribe(({ tableroId, presentes }) => {
      if (tableroId !== this.tableroId) return;
      this.presentes.set(presentes);
      // Quien se desconectó ya no está moviendo nada
      this.arrastresAjenos.update((a) => Object.fromEntries(Object.entries(a).filter(([, x]) => presentes.includes(x.usuarioId))));
    });
    alTablero(merge(tr.escuchar('miembro:entro'), tr.escuchar('miembro:salio'), tr.escuchar('miembro:actualizado'))).subscribe(() =>
      this.recargarTablero(),
    );
    alTablero(tr.escuchar('tablero:actualizado')).subscribe((t) => this.tablero.update((actual) => (actual ? { ...actual, ...t } : actual)));
    alTablero(merge(tr.escuchar('tablero:borrado'), tr.escuchar('tablero:expulsado'))).subscribe((e) => {
      const id = 'id' in e ? e.id : e.tableroId;
      if (id === this.tableroId) void this.salirDelTablero('Este tablero ya no está disponible para ti');
    });
    alTablero(tr.reconexiones()).subscribe(() => void this.abrir(this.tableroId));
  }

  // =====================================================================
  // Notas
  // =====================================================================

  async crearNota(datos: DatosNota): Promise<Nota> {
    const nota = await this.notasApi.crear(this.tableroId, datos);
    this.ponerNota(nota);
    this.refrescarResumenSi(nota);
    return nota;
  }

  async editarNota(notaId: string, cambios: DatosNota): Promise<Nota> {
    const nota = await this.notasApi.editar(this.tableroId, notaId, cambios);
    this.ponerNota(nota);
    this.refrescarResumenSi(nota);
    return nota;
  }

  /** Mientras arrastro: muevo local y aviso a los demás (a lo mucho cada 60 ms). */
  arrastrarNota(notaId: string, posicion: Posicion): void {
    this.notas.update((notas) => notas.map((n) => (n.id === notaId ? { ...n, ...posicion } : n)));
    const ahora = Date.now();
    if (ahora - this.ultimoArrastre < INTERVALO_ARRASTRE_MS) return;
    this.ultimoArrastre = ahora;
    this.tiempoReal.avisarArrastre(this.tableroId, notaId, posicion.posX, posicion.posY);
  }

  /** Al soltar: se guarda y queda encima de las demás. */
  async soltarNota(notaId: string, posicion: Posicion): Promise<void> {
    this.arrastrarNota(notaId, posicion);
    try {
      const guardada = await this.notasApi.mover(this.tableroId, notaId, posicion, this.tiempoReal.conexionId);
      this.notas.update((notas) => notas.map((n) => (n.id === notaId ? { ...n, ...guardada } : n)));
    } catch (e) {
      this.avisos.error(mensajeDeError(e));
    }
  }

  async pagarNota(notaId: string, pagadoPor?: string): Promise<void> {
    const { nota, siguiente } = await this.notasApi.pagar(this.tableroId, notaId, pagadoPor);
    this.ponerNota(nota);
    this.refrescarResumenSi(nota);
    if (siguiente) {
      this.ponerNota(siguiente);
      this.avisos.info('Se clavó la nota del siguiente periodo');
    }
  }

  async abonar(notaId: string, monto: number): Promise<void> {
    const nota = await this.notasApi.abonar(this.tableroId, notaId, monto);
    this.ponerNota(nota);
    this.refrescarResumenSi(nota);
  }

  async borrarNota(notaId: string): Promise<void> {
    const previa = this.notas().find((n) => n.id === notaId);
    await this.notasApi.borrar(this.tableroId, notaId);
    this.quitarNota(notaId);
    this.refrescarResumenSi(previa);
  }

  // =====================================================================
  // Archivo y búsqueda
  // =====================================================================

  /** Alterna entre el corcho y el archivo (el archivo se carga al abrirlo). */
  async mostrarArchivo(ver: boolean): Promise<void> {
    this.verArchivo.set(ver);
    if (ver) await this.cargarArchivo();
  }

  async archivarNota(notaId: string, archivada: boolean): Promise<void> {
    this.ponerNota(await this.notasApi.archivar(this.tableroId, notaId, archivada));
  }

  /** Limpia el corcho de golpe; devuelve cuántas se fueron al archivo. */
  async archivarSaldadas(): Promise<number> {
    const { archivadas } = await this.notasApi.archivarSaldadas(this.tableroId);
    // Los eventos en vivo ya las van quitando; recargar asegura el corcho aunque lleguen tarde
    if (archivadas) this.notas.set(await this.notasApi.listar(this.tableroId));
    return archivadas;
  }

  /** La nota puede estar en el corcho o en el archivo. */
  buscarNota(notaId: string | null): Nota | null {
    if (!notaId) return null;
    return this.notas().find((n) => n.id === notaId) ?? this.archivadas().find((n) => n.id === notaId) ?? null;
  }

  // =====================================================================
  // Fotos de tickets (Cloudinary)
  // =====================================================================

  async subirFoto(notaId: string, archivo: File): Promise<Adjunto> {
    const firma = await this.archivosApi.firmaDeTablero(this.tableroId);
    const subido = await this.archivosApi.subir(firma, archivo);
    const adjunto = await this.notasApi.agregarFoto(this.tableroId, notaId, subido);
    this.cambiarNota(notaId, (n) => ({ ...n, adjuntos: [...n.adjuntos.filter((a) => a.id !== adjunto.id), adjunto] }));
    return adjunto;
  }

  async quitarFoto(notaId: string, adjuntoId: string): Promise<void> {
    await this.notasApi.quitarFoto(this.tableroId, notaId, adjuntoId);
    this.cambiarNota(notaId, (n) => ({ ...n, adjuntos: n.adjuntos.filter((a) => a.id !== adjuntoId) }));
  }

  // =====================================================================
  // Comentarios
  // =====================================================================

  /** Carga los comentarios de la nota que se abrió; los nuevos llegan en vivo. */
  async cargarComentarios(notaId: string | null): Promise<void> {
    this.notaComentada = notaId;
    this.comentarios.set([]);
    if (!notaId) return;
    const lista = await this.comentariosApi.listar(this.tableroId, notaId);
    if (this.notaComentada === notaId) this.comentarios.set(lista);
  }

  async comentar(notaId: string, texto: string, menciones: string[]): Promise<void> {
    this.ponerComentario(await this.comentariosApi.crear(this.tableroId, notaId, texto, menciones));
  }

  async borrarComentario(notaId: string, comentarioId: string): Promise<void> {
    await this.comentariosApi.borrar(this.tableroId, notaId, comentarioId);
    this.comentarios.update((lista) => lista.filter((c) => c.id !== comentarioId));
  }

  // =====================================================================
  // Presupuestos por categoría
  // =====================================================================

  async guardarPresupuesto(categoriaId: string, montoMensual: number): Promise<void> {
    await this.presupuestosApi.guardar(this.tableroId, categoriaId, montoMensual);
    this.refrescarBalance();
  }

  async borrarPresupuesto(presupuestoId: string): Promise<void> {
    await this.presupuestosApi.borrar(this.tableroId, presupuestoId);
    this.balance.update((b) => (b ? { ...b, presupuestos: b.presupuestos.filter((p) => p.presupuestoId !== presupuestoId) } : b));
  }

  // =====================================================================
  // Metas de ahorro
  // =====================================================================

  async crearMeta(datos: DatosMeta): Promise<void> {
    this.ponerMeta(await this.metasApi.crear(this.tableroId, datos));
  }

  /** Monto positivo = aporte; negativo = retiro. */
  async aportarMeta(metaId: string, monto: number): Promise<Meta> {
    const meta = await this.metasApi.aportar(this.tableroId, metaId, monto);
    this.ponerMeta(meta);
    return meta;
  }

  async borrarMeta(metaId: string): Promise<void> {
    await this.metasApi.borrar(this.tableroId, metaId);
    this.metas.update((lista) => lista.filter((m) => m.id !== metaId));
  }

  // =====================================================================
  // Ingresos (flujo del mes, tablero personal)
  // =====================================================================

  async crearIngreso(datos: DatosIngreso): Promise<void> {
    const ingreso = await this.ingresosApi.crear(this.tableroId, datos);
    this.ingresos.update((lista) => [ingreso, ...lista.filter((i) => i.id !== ingreso.id)]);
    this.refrescarBalance();
  }

  async borrarIngreso(ingresoId: string): Promise<void> {
    await this.ingresosApi.borrar(this.tableroId, ingresoId);
    this.ingresos.update((lista) => lista.filter((i) => i.id !== ingresoId));
    this.refrescarBalance();
  }

  // =====================================================================
  // Importar estado de cuenta
  // =====================================================================

  async importar(movimientos: Movimiento[]): Promise<ResultadoImportacion> {
    const resultado = await this.notasApi.importar(this.tableroId, movimientos);
    await Promise.all([this.recargarNotas(), this.cargarFinanzas(this.esPersonal())]);
    if (resultado.archivadas && this.verArchivo()) await this.cargarArchivo();
    this.refrescarBalance();
    return resultado;
  }

  // =====================================================================
  // Pagos
  // =====================================================================

  /** Manda al navegador a la página de pago de Stripe (el pago se registra al cobrarse). */
  async pagarConTarjeta(datos: { aUsuarioId: string; monto: number; notaId?: string; concepto?: string }): Promise<void> {
    const { url } = await this.cobrosApi.pagar(this.tableroId, datos);
    window.location.assign(url);
  }

  /** Regreso de Stripe con ?sesion=…: deja el pago registrado aunque el webhook no haya llegado. */
  async verificarPagoConTarjeta(tableroId: string, sesion: string): Promise<boolean> {
    const { pagado, pago } = await this.cobrosApi.verificar(tableroId, sesion);
    if (pago) this.ponerPago(pago);
    if (pagado) this.refrescarBalance();
    return pagado;
  }

  /** Registra (pendientes de confirmar) todos mis pagos del plan para quedar a mano. */
  async liquidarMisDeudas(): Promise<number> {
    const { pagos } = await this.pagosApi.liquidarMisDeudas(this.tableroId);
    for (const pago of pagos) this.ponerPago(pago);
    return pagos.length;
  }


  async registrarPago(datos: DatosPago): Promise<Pago> {
    const pago = await this.pagosApi.registrar(this.tableroId, datos);
    this.ponerPago(pago);
    return pago;
  }

  async confirmarPago(pagoId: string): Promise<void> {
    this.ponerPago(await this.pagosApi.confirmar(this.tableroId, pagoId));
  }

  async rechazarPago(pagoId: string): Promise<void> {
    this.ponerPago(await this.pagosApi.rechazar(this.tableroId, pagoId));
  }

  // =====================================================================
  // Invitaciones (solo admins de tableros compartidos)
  // =====================================================================

  async cargarInvitaciones(): Promise<void> {
    const todas = await this.invitacionesApi.listar(this.tableroId);
    this.invitaciones.set(todas.filter((i) => i.estado === 'pendiente'));
  }

  async invitar(datos: DatosInvitacion): Promise<Invitacion> {
    const invitacion = await this.invitacionesApi.crear(this.tableroId, datos);
    this.invitaciones.update((lista) => [invitacion, ...lista]);
    return invitacion;
  }

  async cancelarInvitacion(invitacionId: string): Promise<void> {
    await this.invitacionesApi.cancelar(this.tableroId, invitacionId);
    this.invitaciones.update((lista) => lista.filter((i) => i.id !== invitacionId));
  }

  enlaceDe(invitacion: Invitacion): string {
    return this.invitacionesApi.enlace(invitacion.codigo);
  }

  // =====================================================================
  // Categorías personalizadas
  // =====================================================================

  async crearCategoria(datos: DatosCategoria): Promise<Categoria> {
    const categoria = await this.categoriasApi.crear(this.tableroId, datos);
    this.ponerCategoria(categoria);
    return categoria;
  }

  async editarCategoria(categoriaId: string, cambios: DatosCategoria): Promise<void> {
    this.ponerCategoria(await this.categoriasApi.editar(this.tableroId, categoriaId, cambios));
    this.refrescarResumenSi();
  }

  async borrarCategoria(categoriaId: string): Promise<void> {
    await this.categoriasApi.borrar(this.tableroId, categoriaId);
    this.categorias.update((lista) => lista.filter((c) => c.id !== categoriaId));
    this.notas.update((notas) => notas.map((n) => (n.categoriaId === categoriaId ? { ...n, categoriaId: null } : n)));
    this.refrescarResumenSi();
  }

  // =====================================================================
  // Tablero y miembros
  // =====================================================================

  async cambiarTipo(tipo: TipoTablero): Promise<void> {
    const tablero = await this.tableros.cambiarTipo(this.tableroId, tipo);
    this.tablero.update((actual) => (actual ? { ...actual, ...tablero } : actual));
    this.refrescarBalance();
  }

  async salirme(): Promise<void> {
    await this.miembrosApi.salir(this.tableroId);
    await this.salirDelTablero('Saliste del tablero');
  }

  async borrarTablero(): Promise<void> {
    await this.tableros.borrar(this.tableroId);
    await this.salirDelTablero('Tablero borrado');
  }

  // =====================================================================
  // Consultas para los componentes
  // =====================================================================

  miembro(usuarioId: string | null | undefined): Miembro | undefined {
    return usuarioId ? this.miembrosPorId().get(usuarioId) : undefined;
  }

  nombreDe(usuarioId: string | null | undefined): string {
    if (usuarioId === this.yoId()) return 'Tú';
    const m = this.miembro(usuarioId);
    return m?.apodo || m?.nombre || 'Alguien';
  }

  // =====================================================================
  // Privados
  // =====================================================================

  private pasaFiltro(nota: Nota): boolean {
    const filtro = this.filtro();
    if (filtro === 'por_pagar') return nota.estado === 'por_pagar';
    if (filtro === 'pagadas') return nota.estado !== 'por_pagar';
    return true;
  }

  private coincide(nota: Nota, texto: string): boolean {
    const categoria = this.categoriasPorId().get(nota.categoriaId ?? '')?.nombre;
    return [nota.titulo, nota.descripcion, nota.contraparte, categoria, nota.monto?.toString()].some((campo) => campo && normalizar(campo).includes(texto));
  }

  /**
   * Inserta o reemplaza (los eventos en vivo pueden llegar antes o después de la respuesta HTTP).
   * Una nota archivada sale del corcho y pasa al archivo, y al revés.
   */
  private ponerNota(nota: Nota): void {
    if (nota.tableroId !== this.tableroId) return;
    const [destino, otra] = nota.archivada ? [this.archivadas, this.notas] : [this.notas, this.archivadas];
    otra.update((lista) => lista.filter((n) => n.id !== nota.id));
    if (nota.archivada && !this.verArchivo()) return; // el archivo se recarga al abrirlo
    destino.update((lista) => (lista.some((n) => n.id === nota.id) ? lista.map((n) => (n.id === nota.id ? nota : n)) : [...lista, nota]));
  }

  private cambiarNota(notaId: string, cambio: (nota: Nota) => Nota): void {
    const aplicar = (lista: Nota[]) => lista.map((n) => (n.id === notaId ? cambio(n) : n));
    this.notas.update(aplicar);
    this.archivadas.update(aplicar);
  }

  private ponerComentario(comentario: Comentario): void {
    this.comentarios.update((lista) => (lista.some((c) => c.id === comentario.id) ? lista : [...lista, comentario]));
  }

  private contarComentario(notaId: string, delta: number): void {
    this.cambiarNota(notaId, (n) => ({ ...n, comentarios: Math.max(0, (n.comentarios ?? 0) + delta) }));
  }

  private ponerMeta(meta: Meta): void {
    if (meta.tableroId !== this.tableroId) return;
    this.metas.update((lista) => (lista.some((m) => m.id === meta.id) ? lista.map((m) => (m.id === meta.id ? meta : m)) : [...lista, meta]));
  }

  /** Metas (todos los tableros) e ingresos (solo el personal). No bloquean la carga del corcho. */
  private async cargarFinanzas(conIngresos: boolean): Promise<void> {
    try {
      const [metas, ingresos] = await Promise.all([
        this.metasApi.listar(this.tableroId),
        conIngresos ? this.ingresosApi.listar(this.tableroId) : Promise.resolve([]),
      ]);
      this.metas.set(metas);
      this.ingresos.set(ingresos);
    } catch {
      /* el panel de metas no es crítico: se reintenta con el siguiente cambio */
    }
  }

  private async recargarNotas(): Promise<void> {
    try {
      this.notas.set(await this.notasApi.listar(this.tableroId));
    } catch (e) {
      this.avisos.error(mensajeDeError(e));
    }
  }

  private async cargarArchivo(): Promise<void> {
    this.cargandoArchivo.set(true);
    try {
      this.archivadas.set(await this.notasApi.listar(this.tableroId, { archivadas: true }));
    } catch (e) {
      this.avisos.error(mensajeDeError(e));
    } finally {
      this.cargandoArchivo.set(false);
    }
  }

  private ponerCategoria(categoria: Categoria): void {
    if (categoria.tableroId !== this.tableroId) return;
    this.categorias.update((lista) =>
      [...lista.filter((c) => c.id !== categoria.id), categoria].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    );
  }

  private quitarNota(id: string): void {
    this.notas.update((notas) => notas.filter((n) => n.id !== id));
    this.archivadas.update((notas) => notas.filter((n) => n.id !== id));
  }

  private ponerPago(pago: Pago): void {
    if (pago.tableroId !== this.tableroId) return;
    this.pagos.update((pagos) => (pagos.some((p) => p.id === pago.id) ? pagos.map((p) => (p.id === pago.id ? pago : p)) : [pago, ...pagos]));
  }

  private soltarAjeno(notaId: string): void {
    clearTimeout(this.caducidades.get(notaId));
    this.caducidades.delete(notaId);
    this.arrastresAjenos.update(({ [notaId]: _, ...resto }) => resto);
  }

  /** Si alguien deja de mandar movimiento (se le fue la red), su nota vuelve a su lugar. */
  private caducarArrastre(notaId: string): void {
    clearTimeout(this.caducidades.get(notaId));
    this.caducidades.set(notaId, setTimeout(() => this.soltarAjeno(notaId), ARRASTRE_CADUCA_MS));
  }

  /**
   * El servidor solo avisa balance:cambio cuando se mueve dinero entre miembros. Pero en un
   * tablero personal cualquier nota cambia el resumen, las notas a meses cambian la lista de planes
   * y un gasto con categoría mueve su presupuesto.
   */
  private refrescarResumenSi(nota?: Nota): void {
    const tocaPresupuesto = !!nota?.categoriaId && this.presupuestosPorCategoria().has(nota.categoriaId);
    if (this.esPersonal() || nota?.planId || nota?.plazoMeses || tocaPresupuesto) this.refrescarBalance();
  }

  /** Varios cambios seguidos → una sola petición de balance. */
  private refrescarBalance(): void {
    clearTimeout(this.temporizadorBalance);
    this.temporizadorBalance = setTimeout(async () => {
      try {
        const antes = this.presupuestos();
        const balance = await this.balanceApi.obtener(this.tableroId);
        this.balance.set(balance);
        this.avisarPresupuestos(antes, balance.presupuestos ?? []);
      } catch {
        /* se reintentará con el siguiente cambio */
      }
    }, ESPERA_BALANCE_MS);
  }

  /** Aviso al cruzar el 80 % o el 100 % de un presupuesto (solo cuando empeora, no cada vez). */
  private avisarPresupuestos(antes: AvancePresupuesto[], despues: AvancePresupuesto[]): void {
    const nivel = { ok: 0, cerca: 1, excedido: 2 };
    const previos = new Map(antes.map((p) => [p.presupuestoId, p.estado]));
    for (const p of despues) {
      const previo = previos.get(p.presupuestoId);
      if (!previo || nivel[p.estado] <= nivel[previo]) continue;
      const nombre = this.categoriasPorId().get(p.categoriaId)?.nombre ?? 'una categoría';
      if (p.estado === 'excedido') this.avisos.error(`Te pasaste del presupuesto de ${nombre} (${p.porcentaje} %)`);
      else this.avisos.info(`Ya vas al ${p.porcentaje} % del presupuesto de ${nombre}`);
    }
  }

  private async recargarTablero(): Promise<void> {
    try {
      this.tablero.set(await this.tableros.obtener(this.tableroId));
      this.refrescarBalance();
    } catch (e) {
      this.error.set(mensajeDeError(e));
    }
  }

  private async salirDelTablero(mensaje: string): Promise<void> {
    this.avisos.info(mensaje);
    await this.router.navigateByUrl('/tableros');
  }
}
