import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PerfilService } from '../../core/services/perfil/perfil.service';
import { esErrorApi, mensajeDeError } from '../../core/utils/errores';
import { Boton } from '../../shared/components/boton/boton';
import { Campo } from '../../shared/components/campo/campo';
import { Icono } from '../../shared/components/icono/icono';
import { Marca } from '../../shared/components/marca/marca';

/** Llega desde el enlace del correo (/restablecer?token=…) y pone la contraseña nueva. */
@Component({
  selector: 'app-restablecer-page',
  imports: [ReactiveFormsModule, RouterLink, Boton, Campo, Icono, Marca],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './restablecer-page.html',
  styleUrl: './recuperacion.scss',
})
export class RestablecerPage {
  private readonly perfil = inject(PerfilService);
  private readonly fb = inject(NonNullableFormBuilder);

  /** ?token= de la URL (withComponentInputBinding) */
  readonly token = input<string>('');

  protected readonly formulario = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    repetir: ['', Validators.required],
  });
  protected readonly enviando = signal(false);
  protected readonly listo = signal(false);
  /** El enlace venció o ya se usó: hay que pedir otro */
  protected readonly vencido = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async enviar(): Promise<void> {
    const { password, repetir } = this.formulario.getRawValue();
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (password !== repetir) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    try {
      await this.perfil.restablecer(this.token(), password);
      this.listo.set(true);
    } catch (e) {
      if (esErrorApi(e) && (e.status === 410 || e.status === 404)) this.vencido.set(true);
      else this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }
}
