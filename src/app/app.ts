import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Avisos } from './shared/components/avisos/avisos';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Avisos],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <app-avisos />
  `,
})
export class App {}
