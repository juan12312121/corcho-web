import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta } from '../../../../core/models';
import { AvisosService } from '../../../../core/services/avisos/avisos.service';
import { mensajeDeError } from '../../../../core/utils/errores';
import { diasHasta, hoyISO } from '../../../../core/utils/fechas';
import { BarraProgreso } from '../../../../shared/components/barra-progreso/barra-progreso';
import { Boton } from '../../../../shared/components/boton/boton';
import { Icono } from '../../../../shared/components/icono/icono';
import { COLORES_CATEGORIA } from '../../../../shared/constants/opciones';
import { FechaCortaPipe } from '../../../../shared/pipes/fecha-corta.pipe';
import { MonedaPipe } from '../../../../shared/pipes/moneda.pipe';
import { TableroStore } from '../../tablero.store';

/** Metas de ahorro: cuánto va de cada una, aportar/retirar y crear nuevas. */
@Component({
  selector: 'app-metas-panel',
  imports: [FormsModule, BarraProgreso, Boton, Icono, MonedaPipe, FechaCortaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './metas-panel.html',
  styleUrl: './metas-panel.scss',
})
export class MetasPanel {
  protected readonly store = inject(TableroStore);
  private readonly avisos = inject(AvisosService);

  protected readonly colores = COLORES_CATEGORIA.slice(0, 6);
  protected readonly hoy = hoyISO();
  protected readonly creando = signal(false);
  protected readonly ocupada = signal<string | null>(null);
  /** Monto escrito en el campo de aporte de cada meta */
  protected readonly montos: Record<string, number | null> = {};
  protected nueva = { nombre: '', objetivo: null as number | null, fechaLimite: '', color: COLORES_CATEGORIA[0].valor };

  protected readonly filas = computed(() =>
    this.store.metas().map((m) => {
      const falta = Math.max(0, m.objetivo - m.ahorrado);
      const dias = m.fechaLimite ? diasHasta(m.fechaLimite) : null;
      // Cuánto habría que juntar al mes para llegar a tiempo
      const meses = dias !== null && dias > 0 ? Math.max(1, Math.ceil(dias / 30)) : null;
      return {
        ...m,
        falta,
        lograda: falta === 0,
        avance: m.ahorrado / m.objetivo,
        porMes: meses && falta > 0 ? Math.ceil((falta / meses) * 100) / 100 : null,
        vencida: dias !== null && dias < 0 && falta > 0,
        puedeBorrar: m.creadoPor === this.store.yoId() || this.store.soyAdmin(),
      };
    }),
  );

  protected async crear(): Promise<void> {
    const objetivo = Number(this.nueva.objetivo);
    if (!this.nueva.nombre.trim() || !(objetivo > 0)) {
      this.avisos.error('Ponle nombre y un objetivo mayor a cero');
      return;
    }
    await this.ejecutar('nueva', async () => {
      await this.store.crearMeta({
        nombre: this.nueva.nombre.trim(),
        objetivo,
        fechaLimite: this.nueva.fechaLimite || null,
        color: this.nueva.color,
      });
      this.nueva = { nombre: '', objetivo: null, fechaLimite: '', color: this.nueva.color };
      this.creando.set(false);
      this.avisos.exito('Meta creada');
    });
  }

  /** signo = 1 aporta, -1 retira */
  protected async mover(meta: Meta, signo: 1 | -1): Promise<void> {
    const monto = Number(this.montos[meta.id]);
    if (!(monto > 0)) {
      this.avisos.error('Escribe cuánto');
      return;
    }
    await this.ejecutar(meta.id, async () => {
      const guardada = await this.store.aportarMeta(meta.id, signo * monto);
      this.montos[meta.id] = null;
      if (signo > 0 && guardada.ahorrado >= guardada.objetivo && meta.ahorrado < meta.objetivo) this.avisos.exito(`¡Lograste la meta "${meta.nombre}"! 🎉`);
      else this.avisos.exito(signo > 0 ? 'Aporte guardado' : 'Retiro guardado');
    });
  }

  protected async borrar(meta: Meta): Promise<void> {
    await this.ejecutar(meta.id, () => this.store.borrarMeta(meta.id));
  }

  private async ejecutar(clave: string, accion: () => Promise<unknown>): Promise<void> {
    this.ocupada.set(clave);
    try {
      await accion();
    } catch (e) {
      this.avisos.error(mensajeDeError(e));
    } finally {
      this.ocupada.set(null);
    }
  }
}
