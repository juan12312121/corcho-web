import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { BalanceCompartido, Miembro, Pago, Transferencia } from '../../../../core/models';
import { Avatar } from '../../../../shared/components/avatar/avatar';
import { Boton } from '../../../../shared/components/boton/boton';
import { Etiqueta } from '../../../../shared/components/etiqueta/etiqueta';
import { Icono } from '../../../../shared/components/icono/icono';
import { DatosTransferencia } from '../../../../shared/components/datos-transferencia/datos-transferencia';
import { Monto } from '../../../../shared/components/monto/monto';
import { MonedaPipe } from '../../../../shared/pipes/moneda.pipe';
import { ListaPlanes } from '../lista-planes/lista-planes';

/** Panel "Balance y cuentas" del tablero compartido. */
@Component({
  selector: 'app-panel-compartido',
  imports: [ListaPlanes, Avatar, Boton, DatosTransferencia, Etiqueta, Icono, Monto, MonedaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panel-compartido.html',
  styleUrl: './panel-compartido.scss',
})
export class PanelCompartido {
  readonly balance = input.required<BalanceCompartido>();
  readonly miembros = input.required<Map<string, Miembro>>();
  readonly pagosPorConfirmar = input<Pago[]>([]);
  readonly moneda = input('MXN');
  readonly yoId = input.required<string>();

  readonly pagar = output<Transferencia>();
  readonly confirmar = output<Pago>();
  readonly rechazar = output<Pago>();
  readonly abrirNota = output<string>();

  protected readonly netos = computed(() =>
    this.balance().netos.map((n) => ({ ...n, miembro: this.miembros().get(n.usuarioId), soyYo: n.usuarioId === this.yoId() })),
  );

  protected nombre(usuarioId: string): string {
    if (usuarioId === this.yoId()) return 'Tú';
    const m = this.miembros().get(usuarioId);
    return m?.apodo || m?.nombre || 'Alguien';
  }

  /** "Beto te paga", "Le pagas a Ana", "Caro le paga a Ana". */
  protected fraseSugerencia(t: Transferencia): string {
    if (t.a === this.yoId()) return `${this.nombre(t.de)} te paga`;
    if (t.de === this.yoId()) return `Le pagas a ${this.nombre(t.a)}`;
    return `${this.nombre(t.de)} le paga a ${this.nombre(t.a)}`;
  }

  /** CLABE de a quién le toca recibir, solo si el que paga soy yo. */
  protected cuentaPara(t: Transferencia): Miembro | null {
    const destino = this.miembros().get(t.a);
    return t.de === this.yoId() && destino?.clabe ? destino : null;
  }

  /** Solo puedo registrar pagos donde yo pago o yo recibo. */
  protected puedoRegistrar(t: Transferencia): boolean {
    return t.de === this.yoId() || t.a === this.yoId();
  }
}
