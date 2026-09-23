import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColorNota } from '../../core/models';
import { Boton } from '../../shared/components/boton/boton';
import { Icono } from '../../shared/components/icono/icono';
import { Marca } from '../../shared/components/marca/marca';
import { NotaAdhesiva } from '../../shared/components/nota-adhesiva/nota-adhesiva';

interface NotaEjemplo {
  tipo: string;
  titulo: string;
  monto: string;
  pie: string;
  color: ColorNota;
  pin: string;
  giro: number;
}

interface Beneficio {
  icono: string;
  titulo: string;
  texto: string;
}

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, Marca, Boton, Icono, NotaAdhesiva],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage {
  protected readonly notas: NotaEjemplo[] = [
    { tipo: 'Gasto', titulo: 'Súper del sábado', monto: '$1,250.00', pie: 'Pagó Ana · entre 4', color: 'amarillo', pin: 'rojo', giro: -3 },
    { tipo: 'Servicio', titulo: 'Luz bimestral', monto: '$842.50', pie: 'Vence en 3 días', color: 'azul', pin: 'amarillo', giro: 2.5 },
    { tipo: 'Préstamo', titulo: 'Beto → Caro', monto: '$400.00', pie: 'Abonado 37%', color: 'rosa', pin: 'verde', giro: -1.5 },
    { tipo: 'Recordatorio', titulo: 'Comprar garrafón', monto: '', pie: 'Hoy, 6:00 pm', color: 'naranja', pin: 'morado', giro: 3 },
  ];

  protected readonly beneficios: Beneficio[] = [
    { icono: 'person', titulo: 'Tu tablero personal', texto: 'Tus gastos del mes, los recibos que vencen y lo que le debes (o te deben) a alguien, a la vista.' },
    { icono: 'group', titulo: 'Compartido con los tuyos', texto: 'Invita a tu familia o amigos: el súper, la luz o la renta se reparten solos, igual o como acuerden.' },
    { icono: 'bolt', titulo: 'En tiempo real', texto: 'Cuando alguien clava una nota o paga, todos lo ven al momento. Y Corcho te dice cómo quedar a mano.' },
  ];
}
