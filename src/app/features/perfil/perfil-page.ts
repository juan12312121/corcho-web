import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CambiosPerfil, Usuario } from '../../core/models';
import { ArchivoInvalidoError } from '../../core/services/archivos/archivos.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { PerfilService } from '../../core/services/perfil/perfil.service';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { limpiarClabe, validarClabe } from '../../core/utils/clabe';
import { mensajeDeError } from '../../core/utils/errores';
import { Avatar } from '../../shared/components/avatar/avatar';
import { Boton } from '../../shared/components/boton/boton';
import { Campo } from '../../shared/components/campo/campo';
import { Icono } from '../../shared/components/icono/icono';
import { SelectorColor } from '../../shared/components/selector-color/selector-color';
import { COLORES_CATEGORIA } from '../../shared/constants/opciones';

type Seccion = 'datos' | 'avisos' | 'pago' | 'ingreso' | 'password';

/** Celular de 10 dígitos (o con lada 52). */
function validarCelular(control: AbstractControl<string>): ValidationErrors | null {
  const digitos = (control.value ?? '').replace(/\D/g, '');
  if (!digitos) return null;
  return digitos.length === 10 || (digitos.length === 12 && digitos.startsWith('52')) ? null : { celular: true };
}

function passwordsIguales(grupo: AbstractControl): ValidationErrors | null {
  const { nueva, repetir } = grupo.value as { nueva: string; repetir: string };
  return repetir && nueva !== repetir ? { distintas: true } : null;
}

/** Mi perfil: foto, nombre y color; avisos por WhatsApp; CLABE para que me paguen; contraseña. */
@Component({
  selector: 'app-perfil-page',
  imports: [ReactiveFormsModule, Avatar, Boton, Campo, Icono, SelectorColor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfil-page.html',
  styleUrl: './perfil-page.scss',
})
export class PerfilPage implements OnInit {
  private readonly perfil = inject(PerfilService);
  private readonly avisos = inject(AvisosService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly sesion = inject(SesionService);

  protected readonly colores = COLORES_CATEGORIA;
  protected readonly guardando = signal<Seccion | null>(null);
  protected readonly errores = signal<Partial<Record<Seccion, string>>>({});
  protected readonly subiendoFoto = signal(false);

  protected readonly datos = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    color: [COLORES_CATEGORIA[0].valor],
  });

  protected readonly avisosWhatsapp = this.fb.group({
    telefono: ['', validarCelular],
    activos: [false],
  });

  protected readonly pago = this.fb.group({
    clabe: ['', validarClabe],
    banco: ['', Validators.maxLength(60)],
    titularCuenta: ['', Validators.maxLength(80)],
  });

  /** Privado: en los tableros compartidos solo se usa tu porcentaje para repartir */
  protected readonly ingreso = this.fb.group({
    mensual: this.fb.control<number | null>(null, [Validators.min(0.01)]),
  });

  protected readonly password = this.fb.group(
    {
      actual: ['', Validators.required],
      nueva: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      repetir: ['', Validators.required],
    },
    { validators: passwordsIguales },
  );

  constructor() {
    // Si el usuario cambia (al guardar o al cargar), los formularios lo reflejan
    effect(() => {
      const usuario = this.sesion.usuario();
      if (usuario) untracked(() => this.llenar(usuario));
    });
  }

  ngOnInit(): void {
    void this.perfil.obtener().catch((e) => this.avisos.error(mensajeDeError(e)));
  }

  protected async cambiarFoto(evento: Event): Promise<void> {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    campo.value = '';
    if (!archivo) return;
    this.subiendoFoto.set(true);
    try {
      await this.perfil.cambiarFoto(archivo);
      this.avisos.exito('Foto actualizada');
    } catch (e) {
      this.avisos.error(e instanceof ArchivoInvalidoError ? e.message : mensajeDeError(e));
    } finally {
      this.subiendoFoto.set(false);
    }
  }

  protected quitarFoto(): Promise<void> {
    return this.guardar('datos', { avatarUrl: null }, 'Foto quitada');
  }

  protected guardarDatos(): Promise<void> {
    const { nombre, color } = this.datos.getRawValue();
    return this.validarYGuardar('datos', this.datos, { nombre: nombre.trim(), color }, 'Datos guardados');
  }

  protected guardarAvisos(): Promise<void> {
    const { telefono, activos } = this.avisosWhatsapp.getRawValue();
    const digitos = telefono.replace(/\D/g, '');
    if (activos && !digitos) {
      this.error('avisos', 'Para recibir avisos necesitamos tu celular');
      return Promise.resolve();
    }
    return this.validarYGuardar('avisos', this.avisosWhatsapp, { telefono: digitos || null, avisosWhatsapp: activos }, 'Avisos guardados');
  }

  protected guardarPago(): Promise<void> {
    const { clabe, banco, titularCuenta } = this.pago.getRawValue();
    const cambios = { clabe: limpiarClabe(clabe) || null, banco: banco.trim() || null, titularCuenta: titularCuenta.trim() || null };
    return this.validarYGuardar('pago', this.pago, cambios, 'Datos de pago guardados');
  }

  protected guardarIngreso(): Promise<void> {
    const mensual = Number(this.ingreso.getRawValue().mensual);
    return this.validarYGuardar('ingreso', this.ingreso, { ingresoMensual: mensual > 0 ? mensual : null }, mensual > 0 ? 'Ingreso guardado' : 'Ingreso quitado');
  }

  protected async cambiarPassword(): Promise<void> {
    const { actual, nueva } = this.password.getRawValue();
    await this.validarYGuardar('password', this.password, { password: nueva, passwordActual: actual }, 'Contraseña cambiada');
    if (!this.errores().password) this.password.reset();
  }

  protected errorDe(grupo: AbstractControl, campo: string): string | null {
    const control = grupo.get(campo);
    if (!control?.touched || control.valid) return null;
    if (control.hasError('required')) return 'Este dato es obligatorio';
    if (control.hasError('minlength')) return 'Mínimo 8 caracteres';
    if (control.hasError('celular')) return 'Escribe tu celular a 10 dígitos';
    if (control.hasError('clabe')) return control.getError('clabe');
    return 'Revisa este dato';
  }

  private async validarYGuardar(seccion: Seccion, formulario: AbstractControl, cambios: CambiosPerfil, exito: string): Promise<void> {
    if (formulario.invalid) {
      formulario.markAllAsTouched();
      if (formulario.hasError('distintas')) this.error(seccion, 'Las contraseñas no coinciden');
      return;
    }
    await this.guardar(seccion, cambios, exito);
  }

  private async guardar(seccion: Seccion, cambios: CambiosPerfil, exito: string): Promise<void> {
    this.guardando.set(seccion);
    this.error(seccion, undefined);
    try {
      await this.perfil.actualizar(cambios);
      this.avisos.exito(exito);
    } catch (e) {
      this.error(seccion, mensajeDeError(e));
    } finally {
      this.guardando.set(null);
    }
  }

  private error(seccion: Seccion, mensaje: string | undefined): void {
    this.errores.update((e) => ({ ...e, [seccion]: mensaje }));
  }

  private llenar(u: Usuario): void {
    this.datos.reset({ nombre: u.nombre, color: u.color });
    this.avisosWhatsapp.reset({ telefono: u.telefono ?? '', activos: !!u.avisosWhatsapp });
    this.pago.reset({ clabe: u.clabe ?? '', banco: u.banco ?? '', titularCuenta: u.titularCuenta ?? '' });
    this.ingreso.reset({ mensual: u.ingresoMensual ?? null });
  }
}
