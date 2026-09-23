import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { TiempoRealService } from '../../core/services/tiempo-real/tiempo-real.service';
import { Icono } from '../../shared/components/icono/icono';
import { Marca } from '../../shared/components/marca/marca';
import { BandejaInvitaciones } from '../bandeja-invitaciones/bandeja-invitaciones';
import { MenuUsuario } from '../menu-usuario/menu-usuario';

/** Marco de las páginas privadas: barra superior, bandeja de invitaciones y conexión en vivo. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Marca, Icono, BandejaInvitaciones, MenuUsuario],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:scroll)': 'alHacerScroll()' },
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit {
  private readonly tiempoReal = inject(TiempoRealService);
  private readonly avisos = inject(AvisosService);
  private readonly destroyRef = inject(DestroyRef);

  /** La barra se separa del contenido con sombra solo cuando ya hay scroll. */
  protected readonly conSombra = signal(false);

  protected alHacerScroll(): void {
    this.conSombra.set(window.scrollY > 4);
  }

  ngOnInit(): void {
    this.tiempoReal.conectar();
    this.tiempoReal
      .escuchar('tablero:expulsado')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ porMi }) => {
        if (!porMi) this.avisos.info('Te sacaron de un tablero');
      });
    this.tiempoReal
      .escuchar('mencion')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ autor, nota, tablero }) => this.avisos.info(`${autor ?? 'Alguien'} te mencionó en "${nota}" (${tablero})`));
  }
}
