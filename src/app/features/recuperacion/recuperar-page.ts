import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PerfilService } from '../../core/services/perfil/perfil.service';
import { mensajeDeError } from '../../core/utils/errores';
import { Boton } from '../../shared/components/boton/boton';
import { Campo } from '../../shared/components/campo/campo';
import { Icono } from '../../shared/components/icono/icono';
import { Marca } from '../../shared/components/marca/marca';

/** "Olvidé mi contraseña": pide el correo y manda el enlace (la respuesta es igual exista o no). */
@Component({
  selector: 'app-recuperar-page',
  imports: [ReactiveFormsModule, RouterLink, Boton, Campo, Icono, Marca],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recuperar-page.html',
  styleUrl: './recuperacion.scss',
})
export class RecuperarPage {
  private readonly perfil = inject(PerfilService);

  protected readonly formulario = inject(NonNullableFormBuilder).group({ email: ['', [Validators.required, Validators.email]] });
  protected readonly email = this.formulario.controls.email;
  protected readonly enviando = signal(false);
  protected readonly enviado = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected async enviar(): Promise<void> {
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    try {
      const correo = this.email.value.trim();
      await this.perfil.solicitarRecuperacion(correo);
      this.enviado.set(correo);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }
}
