import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ingreso, ResumenPersonal } from '../../../../core/models';
import { AvisosService } from '../../../../core/services/avisos/avisos.service';
import { mensajeDeError } from '../../../../core/utils/errores';
import { hoyISO } from '../../../../core/utils/fechas';
import { Boton } from '../../../../shared/components/boton/boton';
import { Icono } from '../../../../shared/components/icono/icono';
import { FechaCortaPipe } from '../../../../shared/pipes/fecha-corta.pipe';
import { MonedaPipe } from '../../../../shared/pipes/moneda.pipe';
import { TableroStore } from '../../tablero.store';

/** Flujo del mes (tablero personal): entró, salió y cuánto queda; alta y baja de ingresos. */
@Component({
  selector: 'app-flujo-mes',
  imports: [DecimalPipe, FormsModule, Boton, Icono, MonedaPipe, FechaCortaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './flujo-mes.html',
  styleUrl: './flujo-mes.scss',
})
export class FlujoMes {
  protected readonly store = inject(TableroStore);
  private readonly avisos = inject(AvisosService);

  readonly resumen = input.required<ResumenPersonal>();

  protected readonly agregando = signal(false);
  protected readonly ocupado = signal(false);
  protected nuevo = { concepto: '', monto: null as number | null, fecha: hoyISO(), recurrente: false };

  /** Qué parte del ingreso ya se gastó (0 a 1+) */
  protected readonly usado = computed(() => {
    const r = this.resumen();
    return r.ingresosMes > 0 ? r.gastadoMes / r.ingresosMes : 0;
  });
  /** Los del mes en curso primero; los recurrentes siempre cuentan */
  protected readonly lista = computed(() => {
    const mes = this.resumen().mes;
    return this.store.ingresos().filter((i) => i.recurrente || i.fecha.startsWith(mes));
  });

  protected async agregar(): Promise<void> {
    const monto = Number(this.nuevo.monto);
    if (!this.nuevo.concepto.trim() || !(monto > 0)) {
      this.avisos.error('Escribe el concepto y cuánto entró');
      return;
    }
    await this.ejecutar(async () => {
      await this.store.crearIngreso({ concepto: this.nuevo.concepto.trim(), monto, fecha: this.nuevo.fecha || undefined, recurrente: this.nuevo.recurrente });
      this.nuevo = { concepto: '', monto: null, fecha: hoyISO(), recurrente: false };
      this.agregando.set(false);
      this.avisos.exito('Ingreso registrado');
    });
  }

  protected borrar(ingreso: Ingreso): Promise<void> {
    return this.ejecutar(() => this.store.borrarIngreso(ingreso.id));
  }

  private async ejecutar(accion: () => Promise<unknown>): Promise<void> {
    this.ocupado.set(true);
    try {
      await accion();
    } catch (e) {
      this.avisos.error(mensajeDeError(e));
    } finally {
      this.ocupado.set(false);
    }
  }
}
