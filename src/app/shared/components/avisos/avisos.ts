import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AvisosService } from '../../../core/services/avisos/avisos.service';
import { Icono } from '../icono/icono';

const ICONOS = { exito: 'check_circle', error: 'error', info: 'info' } as const;

/** Pinta los avisos (toasts) del AvisosService. Va una sola vez en la raíz de la app. */
@Component({
  selector: 'app-avisos',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pila" aria-live="polite">
      @for (aviso of servicio.avisos(); track aviso.id) {
        <div class="aviso" [class]="'aviso ' + aviso.tipo" [attr.role]="aviso.tipo === 'error' ? 'alert' : 'status'">
          <app-icono [nombre]="iconos[aviso.tipo]" [relleno]="true" />
          <span>{{ aviso.texto }}</span>
          <button type="button" (click)="servicio.cerrar(aviso.id)" aria-label="Cerrar aviso"><app-icono nombre="close" [tamano]="16" /></button>
        </div>
      }
    </div>
  `,
  styles: `
    .pila { position: fixed; z-index: 1000; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px; width: min(92vw, 420px); }
    .aviso {
      display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: var(--radio-m);
      background: var(--texto); color: #fff; box-shadow: var(--sombra-l); font-weight: 700; animation: entrar 200ms ease-out;
    }
    .aviso span { flex: 1; }
    .exito app-icono { color: #7ee2a1; }
    .error { background: #7a1f1f; }
    .info app-icono { color: var(--tinta-clara); }
    button { border: none; background: transparent; color: inherit; cursor: pointer; opacity: 0.7; padding: 2px; }
    @keyframes entrar { from { opacity: 0; transform: translateY(10px); } }
  `,
})
export class Avisos {
  protected readonly servicio = inject(AvisosService);
  protected readonly iconos = ICONOS;
}
