import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { API_URL } from '../../config/api-url.token';
import { RespuestaApi } from '../../models';

type Parametros = Record<string, string | number | boolean | undefined | null>;

interface Opciones {
  params?: Parametros;
  headers?: Record<string, string>;
}

/**
 * Único punto que habla HTTP con el backend. Desenvuelve { ok, data } y
 * devuelve promesas para usarlas con async/await en los stores de signals.
 * Los errores llegan ya traducidos a ErrorApi por el interceptor.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL);

  get<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
    return this.pedir<T>('GET', ruta, undefined, opciones);
  }

  post<T>(ruta: string, cuerpo: unknown = {}, opciones: Opciones = {}): Promise<T> {
    return this.pedir<T>('POST', ruta, cuerpo, opciones);
  }

  patch<T>(ruta: string, cuerpo: unknown, opciones: Opciones = {}): Promise<T> {
    return this.pedir<T>('PATCH', ruta, cuerpo, opciones);
  }

  put<T>(ruta: string, cuerpo: unknown, opciones: Opciones = {}): Promise<T> {
    return this.pedir<T>('PUT', ruta, cuerpo, opciones);
  }

  delete(ruta: string): Promise<void> {
    return this.pedir<void>('DELETE', ruta);
  }

  private pedir<T>(metodo: string, ruta: string, cuerpo?: unknown, { params, headers }: Opciones = {}): Promise<T> {
    const peticion = this.http.request<RespuestaApi<T> | null>(metodo, `${this.base}${ruta}`, {
      body: cuerpo,
      params: this.aParams(params),
      headers: new HttpHeaders(headers ?? {}),
    });
    return firstValueFrom(peticion.pipe(map((r) => (r?.data ?? undefined) as T)));
  }

  private aParams(params: Parametros = {}): HttpParams {
    let http = new HttpParams();
    for (const [clave, valor] of Object.entries(params)) {
      if (valor !== undefined && valor !== null && valor !== '') http = http.set(clave, String(valor));
    }
    return http;
  }
}
