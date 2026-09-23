import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion/sesion.service';

/** Rutas privadas: sin sesión te manda a entrar y recuerda a dónde ibas. */
export const sesionGuard: CanActivateFn = (_ruta, estado) => {
  if (inject(SesionService).autenticado()) return true;
  return inject(Router).createUrlTree(['/entrar'], { queryParams: { volver: estado.url } });
};
