import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { AvisosService } from '../../../../core/services/avisos/avisos.service';
import { mensajeDeError } from '../../../../core/utils/errores';
import { Avatar } from '../../../../shared/components/avatar/avatar';
import { Boton } from '../../../../shared/components/boton/boton';
import { DatosTransferencia } from '../../../../shared/components/datos-transferencia/datos-transferencia';
import { Icono } from '../../../../shared/components/icono/icono';
import { Modal } from '../../../../shared/components/modal/modal';
import { MonedaPipe } from '../../../../shared/pipes/moneda.pipe';
import { TableroStore } from '../../tablero.store';

/**
 * "Pagar todo lo que debo": muestra a quién le toca pagar (con su CLABE para transferir)
 * y registra esos pagos de una vez. Quedan pendientes hasta que cada quien confirme.
 */
@Component({
  selector: 'app-liquidar-modal',
  imports: [Modal, Boton, Avatar, DatosTransferencia, Icono, MonedaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './liquidar-modal.html',
  styleUrl: './liquidar-modal.scss',
})
export class LiquidarModal {
  protected readonly store = inject(TableroStore);
  private readonly avisos = inject(AvisosService);

  readonly abierto = input(false);
  readonly cerrar = output<void>();

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly pagos = computed(() =>
    this.store.misPagosSugeridos().map((s) => {
      const m = this.store.miembro(s.a);
      return { ...s, miembro: m, nombre: this.store.nombreDe(s.a), cuenta: m?.clabe ? { ...m, nombre: this.store.nombreDe(s.a) } : null };
    }),
  );
  protected readonly total = computed(() => this.pagos().reduce((t, p) => t + p.monto, 0));

  protected async confirmar(): Promise<void> {
    this.enviando.set(true);
    this.error.set(null);
    try {
      const cuantos = await this.store.liquidarMisDeudas();
      this.avisos.exito(cuantos ? `Listo: ${cuantos} ${cuantos === 1 ? 'pago registrado' : 'pagos registrados'}; falta que lo confirmen` : 'Ya habías registrado esos pagos');
      this.cerrar.emit();
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }
}
