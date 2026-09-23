import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { AvisosService } from '../../../core/services/avisos/avisos.service';
import { copiar, formatearClabe } from '../../../core/utils/textos';
import { Icono } from '../icono/icono';

export interface DatosCuenta {
  nombre: string;
  clabe: string | null;
  banco: string | null;
  titularCuenta: string | null;
}

/**
 * CLABE de alguien para transferirle, con botón de copiar.
 *   <app-datos-transferencia [cuenta]="miembro" />          tarjeta completa
 *   <app-datos-transferencia [cuenta]="miembro" [compacto]="true" />  solo el botón
 */
@Component({
  selector: 'app-datos-transferencia',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './datos-transferencia.html',
  styleUrl: './datos-transferencia.scss',
})
export class DatosTransferencia {
  private readonly avisos = inject(AvisosService);

  readonly cuenta = input.required<DatosCuenta>();
  readonly compacto = input(false);

  protected readonly copiada = signal(false);
  protected readonly clabe = computed(() => formatearClabe(this.cuenta().clabe ?? ''));

  protected async copiar(): Promise<void> {
    const clabe = this.cuenta().clabe;
    if (!clabe) return;
    if (await copiar(clabe)) {
      this.copiada.set(true);
      this.avisos.exito(`CLABE de ${this.cuenta().nombre} copiada`);
      setTimeout(() => this.copiada.set(false), 2000);
    } else {
      this.avisos.error('No se pudo copiar; selecciónala a mano');
    }
  }
}
