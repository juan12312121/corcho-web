import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** /tableros/:tableroId con un id que no puede existir → de regreso a la lista. */
export const tableroValidoGuard: CanActivateFn = (ruta) => {
  const id = ruta.paramMap.get('tableroId') ?? '';
  return UUID.test(id) || inject(Router).createUrlTree(['/tableros']);
};
