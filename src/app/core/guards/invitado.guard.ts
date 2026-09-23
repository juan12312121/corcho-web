import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion/sesion.service';

/** Landing y login: si ya tienes sesión, no tiene caso verlas; te lleva a tus tableros. */
export const invitadoGuard: CanActivateFn = () => {
  if (!inject(SesionService).autenticado()) return true;
  return inject(Router).createUrlTree(['/tableros']);
};
