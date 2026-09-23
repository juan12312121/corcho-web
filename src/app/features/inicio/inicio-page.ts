import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatosTablero } from '../../core/models';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { Boton } from '../../shared/components/boton/boton';
import { Cargando } from '../../shared/components/cargando/cargando';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';
import { Icono } from '../../shared/components/icono/icono';
import { NuevoTableroModal } from './components/nuevo-tablero-modal/nuevo-tablero-modal';
import { TarjetaTablero } from './components/tarjeta-tablero/tarjeta-tablero';
import { MisTablerosStore } from './mis-tableros.store';

@Component({
  selector: 'app-inicio-page',
  imports: [Boton, Cargando, EstadoVacio, Icono, TarjetaTablero, NuevoTableroModal],
  providers: [MisTablerosStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio-page.html',
  styleUrl: './inicio-page.scss',
})
export class InicioPage implements OnInit {
  protected readonly store = inject(MisTablerosStore);
  private readonly router = inject(Router);
  private readonly avisos = inject(AvisosService);

  protected readonly modalAbierto = signal(false);

  ngOnInit(): void {
    void this.store.cargar();
  }

  /** Se le pasa al modal; si truena, el modal muestra el error. */
  protected readonly crearTablero = async (datos: DatosTablero): Promise<void> => {
    const tablero = await this.store.crear(datos);
    this.modalAbierto.set(false);
    this.avisos.exito(`Tablero "${tablero.nombre}" listo`);
    await this.router.navigate(['/tableros', tablero.id]);
  };
}
