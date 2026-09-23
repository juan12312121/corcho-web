import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URL } from '../config/api-url.token';
import { SesionService } from '../services/sesion/sesion.service';

/** Agrega "Authorization: Bearer <token>" solo a las peticiones a nuestro backend. */
export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const token = inject(SesionService).token();
  if (!token || !peticion.url.startsWith(inject(API_URL))) return siguiente(peticion);
  return siguiente(peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
