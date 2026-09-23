import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { ArchivosService } from '../archivos/archivos.service';
import { SesionService } from '../sesion/sesion.service';
import { CambiosPerfil, Usuario } from '../../models';

/** Mi perfil: datos, foto, datos de pago, avisos y contraseña (también la recuperación). */
@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly api = inject(ApiService);
  private readonly archivos = inject(ArchivosService);
  private readonly sesion = inject(SesionService);

  async obtener(): Promise<Usuario> {
    const usuario = await this.api.get<Usuario>('/auth/yo');
    this.sesion.actualizarUsuario(usuario);
    return usuario;
  }

  async actualizar(cambios: CambiosPerfil): Promise<Usuario> {
    const usuario = await this.api.patch<Usuario>('/auth/yo', cambios);
    this.sesion.actualizarUsuario(usuario);
    return usuario;
  }

  async cambiarFoto(archivo: File): Promise<Usuario> {
    const subido = await this.archivos.subir(await this.archivos.firmaDeAvatar(), archivo);
    return this.actualizar({ avatarUrl: subido.secure_url });
  }

  /** Siempre responde igual (exista o no la cuenta) para no revelar correos. */
  solicitarRecuperacion(email: string): Promise<void> {
    return this.api.post('/auth/recuperar', { email });
  }

  restablecer(token: string, password: string): Promise<void> {
    return this.api.post('/auth/restablecer', { token, password });
  }
}
