import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TableroResumen } from '../../../../core/models';
import { GrupoAvatares } from '../../../../shared/components/grupo-avatares/grupo-avatares';
import { Icono } from '../../../../shared/components/icono/icono';
import { MiniCorcho, NotaMiniatura } from '../../../../shared/components/mini-corcho/mini-corcho';
import { MonedaPipe } from '../../../../shared/pipes/moneda.pipe';

const moneda = new MonedaPipe();

/** Tarjeta de un tablero en "Mis tableros": nombre, gente, notas de muestra y mi saldo. */
@Component({
  selector: 'app-tarjeta-tablero',
  imports: [RouterLink, GrupoAvatares, Icono, MiniCorcho, MonedaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tarjeta-tablero.html',
  styleUrl: './tarjeta-tablero.scss',
})
export class TarjetaTablero {
  readonly tablero = input.required<TableroResumen>();

  protected readonly esPersonal = computed(() => this.tablero().tipo === 'personal');

  protected readonly notas = computed<NotaMiniatura[]>(() =>
    this.tablero().vistaPrevia.map((n) => ({
      titulo: n.titulo,
      detalle: n.monto !== null ? moneda.transform(n.monto, this.tablero().moneda) : undefined,
      color: n.color,
      pinColor: n.pinColor,
    })),
  );

  /** Cómo voy en este tablero: 'debo' | 'me-deben' | 'a-mano'. */
  protected readonly saldo = computed(() => {
    const neto = this.tablero().miNeto;
    if (neto > 0) return 'me-deben';
    return neto < 0 ? 'debo' : 'a-mano';
  });
}
