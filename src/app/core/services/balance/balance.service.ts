import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Balance } from '../../models';

@Injectable({ providedIn: 'root' })
export class BalanceService {
  private readonly api = inject(ApiService);

  obtener(tableroId: string): Promise<Balance> {
    return this.api.get(`/tableros/${tableroId}/balance`);
  }
}
