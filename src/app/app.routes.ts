import { Routes } from '@angular/router';
import { invitadoGuard } from './core/guards/invitado.guard';
import { sesionGuard } from './core/guards/sesion.guard';
import { tableroValidoGuard } from './core/guards/tablero-valido.guard';

/** Todas las páginas se cargan bajo demanda (lazy). */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [invitadoGuard],
    title: 'Corcho — cuentas claras con los tuyos',
    loadComponent: () => import('./features/landing/landing-page').then((m) => m.LandingPage),
  },
  {
    path: 'entrar',
    canActivate: [invitadoGuard],
    title: 'Entrar — Corcho',
    loadComponent: () => import('./features/acceso/acceso-page').then((m) => m.AccesoPage),
  },
  {
    path: 'recuperar',
    canActivate: [invitadoGuard],
    title: 'Recuperar contraseña — Corcho',
    loadComponent: () => import('./features/recuperacion/recuperar-page').then((m) => m.RecuperarPage),
  },
  {
    // Abierta con o sin sesión: el enlace llega por correo
    path: 'restablecer',
    title: 'Nueva contraseña — Corcho',
    loadComponent: () => import('./features/recuperacion/restablecer-page').then((m) => m.RestablecerPage),
  },
  {
    path: 'invitacion/:codigo',
    canActivate: [sesionGuard],
    title: 'Te invitaron — Corcho',
    loadComponent: () => import('./features/invitacion/aceptar-invitacion-page').then((m) => m.AceptarInvitacionPage),
  },
  {
    path: '',
    canActivate: [sesionGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: 'tableros',
        title: 'Mis tableros — Corcho',
        loadComponent: () => import('./features/inicio/inicio-page').then((m) => m.InicioPage),
      },
      {
        path: 'tableros/:tableroId',
        canActivate: [tableroValidoGuard],
        title: 'Tablero — Corcho',
        loadComponent: () => import('./features/tablero/tablero-page').then((m) => m.TableroPage),
      },
      {
        path: 'tableros/:tableroId/reportes',
        canActivate: [tableroValidoGuard],
        title: 'Reportes — Corcho',
        loadComponent: () => import('./features/reportes/reportes-page').then((m) => m.ReportesPage),
      },
      {
        path: 'perfil',
        title: 'Mi perfil — Corcho',
        loadComponent: () => import('./features/perfil/perfil-page').then((m) => m.PerfilPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
