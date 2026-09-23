import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { Avatar } from '../../shared/components/avatar/avatar';
import { Icono } from '../../shared/components/icono/icono';

/** Avatar con menú desplegable: quién soy, ir a mis tableros y cerrar sesión. */
@Component({
  selector: 'app-menu-usuario',
  imports: [RouterLink, Avatar, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'cerrarSiEsFuera($event)',
    '(document:keydown.escape)': 'abierto.set(false)',
  },
  templateUrl: './menu-usuario.html',
  styleUrl: './menu-usuario.scss',
})
export class MenuUsuario {
  protected readonly sesion = inject(SesionService);
  private readonly auth = inject(AuthService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly abierto = signal(false);

  protected cerrarSiEsFuera(evento: MouseEvent): void {
    if (this.abierto() && !this.elemento.nativeElement.contains(evento.target as Node)) this.abierto.set(false);
  }

  protected salir(): void {
    this.abierto.set(false);
    void this.auth.cerrarSesion();
  }
}
