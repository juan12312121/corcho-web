import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { mensajeDeError } from '../../core/utils/errores';
import { Boton } from '../../shared/components/boton/boton';
import { Campo } from '../../shared/components/campo/campo';
import { ControlSegmentado, OpcionSegmento } from '../../shared/components/control-segmentado/control-segmentado';
import { Marca } from '../../shared/components/marca/marca';
import { NotaAdhesiva } from '../../shared/components/nota-adhesiva/nota-adhesiva';

type Modo = 'entrar' | 'registro';

/** Entrar o crear cuenta en la misma pantalla. ?modo=registro abre la pestaña de registro. */
@Component({
  selector: 'app-acceso-page',
  imports: [ReactiveFormsModule, RouterLink, Marca, Boton, Campo, ControlSegmentado, NotaAdhesiva],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acceso-page.html',
  styleUrl: './acceso-page.scss',
})
export class AccesoPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Query params (withComponentInputBinding) */
  readonly modo = input<Modo>('entrar');
  readonly volver = input<string>();

  protected readonly modoActual = linkedSignal<Modo>(() => (this.modo() === 'registro' ? 'registro' : 'entrar'));
  protected readonly esRegistro = computed(() => this.modoActual() === 'registro');
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly pestanas: OpcionSegmento<Modo>[] = [
    { valor: 'entrar', etiqueta: 'Iniciar sesión' },
    { valor: 'registro', etiqueta: 'Crear cuenta' },
  ];

  protected readonly selectorModo = this.fb.control<Modo>('entrar');

  protected readonly formulario = this.fb.group({
    nombre: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.selectorModo.valueChanges.pipe(takeUntilDestroyed()).subscribe((modo) => this.cambiarModo(modo));
  }

  ngOnInit(): void {
    this.cambiarModo(this.modoActual());
  }

  protected cambiarModo(modo: Modo): void {
    this.modoActual.set(modo);
    this.selectorModo.setValue(modo, { emitEvent: false });
    this.error.set(null);
    const nombre = this.formulario.controls.nombre;
    nombre.setValidators(modo === 'registro' ? [Validators.required, Validators.maxLength(80)] : []);
    nombre.updateValueAndValidity();
  }

  protected errorDe(campo: 'nombre' | 'email' | 'password'): string | null {
    const control = this.formulario.controls[campo];
    if (!control.touched || control.valid) return null;
    if (control.hasError('required')) return 'Este dato es obligatorio';
    if (control.hasError('email')) return 'Escribe un correo válido';
    if (control.hasError('minlength')) return 'Mínimo 8 caracteres';
    return 'Revisa este dato';
  }

  protected async enviar(): Promise<void> {
    this.cambiarModo(this.modoActual());
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    const { nombre, email, password } = this.formulario.getRawValue();
    try {
      if (this.esRegistro()) await this.auth.registrarse({ nombre, email, password });
      else await this.auth.iniciarSesion({ email, password });
      await this.router.navigateByUrl(this.destinoSeguro());
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }

  /** Solo rutas internas: evita redirecciones abiertas a otros sitios. */
  private destinoSeguro(): string {
    const volver = this.volver();
    return volver?.startsWith('/') && !volver.startsWith('//') ? volver : '/tableros';
  }
}
