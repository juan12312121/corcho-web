import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../../config/api-url.token';
import { SesionService } from '../sesion/sesion.service';
import { Categoria, Comentario, Miembro, Nota, Pago, PosicionGuardada, Tablero } from '../../models';

/** Aviso personal: alguien me @mencionó en un comentario. */
export interface Mencion {
  tableroId: string;
  tablero: string;
  notaId: string;
  nota: string;
  autor: string | null;
  texto: string;
}

/** Eventos que manda el servidor y la forma de sus datos. */
export interface EventosServidor {
  'nota:creada': Nota;
  'nota:actualizada': Nota;
  'nota:movida': PosicionGuardada;
  'nota:borrada': { id: string };
  'nota:arrastrando': { notaId: string; posX: number; posY: number; usuarioId: string };
  'pago:creado': Pago;
  'pago:actualizado': Pago;
  'pago:borrado': { id: string };
  'pago:por_confirmar': Pago;
  'balance:cambio': { tableroId: string };
  'categoria:guardada': Categoria;
  'categoria:borrada': { id: string };
  'miembro:entro': Miembro;
  'miembro:salio': { usuarioId: string };
  'miembro:actualizado': unknown;
  'tablero:actualizado': Tablero;
  'tablero:borrado': { id: string };
  'tablero:expulsado': { tableroId: string; porMi: boolean };
  'invitacion:nueva': { codigo: string; tableroId: string; tablero: string };
  'comentario:nuevo': Comentario;
  'comentario:borrado': { id: string; notaId: string };
  mencion: Mencion;
  presencia: { tableroId: string; presentes: string[] };
}

type EstadoConexion = 'desconectado' | 'conectando' | 'conectado';

/**
 * Conexión Socket.IO única para toda la app. Se conecta con el token de la
 * sesión y expone cada evento como Observable (los stores se suscriben).
 */
@Injectable({ providedIn: 'root' })
export class TiempoRealService {
  private readonly apiUrl = inject(API_URL);
  private readonly sesion = inject(SesionService);
  private socket: Socket | null = null;
  private readonly estado = signal<EstadoConexion>('desconectado');

  readonly conectado = computed(() => this.estado() === 'conectado');

  /** Id de esta conexión (para no recibir el eco de lo que yo muevo). */
  get conexionId(): string | undefined {
    return this.socket?.id;
  }

  conectar(): Socket | null {
    const token = this.sesion.token();
    if (!token) return null;
    if (this.socket) return this.socket;
    this.estado.set('conectando');
    this.socket = io(this.apiUrl, { auth: { token }, transports: ['websocket'] });
    this.socket.on('connect', () => this.estado.set('conectado'));
    this.socket.on('disconnect', () => this.estado.set('conectando'));
    return this.socket;
  }

  desconectar(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.estado.set('desconectado');
  }

  /** Entra al cuarto del tablero; devuelve quiénes están conectados. */
  async unirse(tableroId: string): Promise<string[]> {
    const respuesta = await this.conectar()?.emitWithAck('tablero:unirse', tableroId);
    return respuesta?.ok ? (respuesta.presentes as string[]) : [];
  }

  salir(tableroId: string): void {
    this.socket?.emit('tablero:salir', tableroId);
  }

  avisarArrastre(tableroId: string, notaId: string, posX: number, posY: number): void {
    this.socket?.volatile.emit('nota:arrastrando', { tableroId, notaId, posX, posY });
  }

  /** Emite cada vez que se recupera la conexión (hay que volver a unirse a los cuartos). */
  reconexiones(): Observable<void> {
    return new Observable((suscriptor) => {
      const socket = this.conectar();
      const manejador = () => suscriptor.next();
      socket?.io.on('reconnect', manejador);
      return () => socket?.io.off('reconnect', manejador);
    });
  }

  escuchar<E extends keyof EventosServidor>(evento: E): Observable<EventosServidor[E]> {
    return new Observable((suscriptor) => {
      const socket = this.conectar();
      const manejador = (datos: EventosServidor[E]) => suscriptor.next(datos);
      socket?.on(evento as string, manejador);
      return () => socket?.off(evento as string, manejador);
    });
  }
}
