import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../api/api.service';
import { SesionService } from '../sesion/sesion.service';
import { TiempoRealService } from '../tiempo-real/tiempo-real.service';
import { DatosLogin, DatosRegistro, Sesion, Usuario } from '../../models';

/** Casos de cuenta: entrar, registrarse y salir (el perfil vive en PerfilService). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly sesion = inject(SesionService);
  private readonly tiempoReal = inject(TiempoRealService);
  private readonly router = inject(Router);

  async iniciarSesion(datos: DatosLogin): Promise<Usuario> {
    return this.abrir(await this.api.post<Sesion>('/auth/login', datos));
  }

  async registrarse(datos: DatosRegistro): Promise<Usuario> {
    return this.abrir(await this.api.post<Sesion>('/auth/registro', datos));
  }

  async cerrarSesion(): Promise<void> {
    this.tiempoReal.desconectar();
    this.sesion.cerrar();
    await this.router.navigateByUrl('/');
  }

  private abrir(sesion: Sesion): Usuario {
    this.sesion.iniciar(sesion);
    return sesion.usuario;
  }
}
