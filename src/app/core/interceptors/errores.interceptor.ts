import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ErrorApi } from '../models';
import { SesionService } from '../services/sesion/sesion.service';

/**
 * Convierte cualquier error HTTP en un ErrorApi uniforme.
 * Si el token venció (401 fuera de /auth), cierra la sesión y manda a entrar.
 */
export const erroresInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  return siguiente(peticion).pipe(
    catchError((respuesta: HttpErrorResponse) => {
      const error = aErrorApi(respuesta);
      if (error.status === 401 && sesion.autenticado() && !peticion.url.includes('/auth/')) {
        sesion.cerrar();
        void router.navigate(['/entrar'], { queryParams: { volver: router.url } });
      }
      return throwError(() => error);
    }),
  );
};

function aErrorApi(respuesta: HttpErrorResponse): ErrorApi {
  if (respuesta.status === 0) {
    return { status: 0, codigo: 'SIN_CONEXION', mensaje: 'No hay conexión con el servidor', detalles: [] };
  }
  const cuerpo = respuesta.error?.error;
  return {
    status: respuesta.status,
    codigo: cuerpo?.codigo ?? 'ERROR',
    mensaje: cuerpo?.mensaje ?? 'Algo salió mal, intenta de nuevo',
    detalles: cuerpo?.detalles ?? [],
  };
}
