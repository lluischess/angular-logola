import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './novedades.component.html',
  styleUrl: './novedades.component.css'
})
export class NovedadesComponent {
  productos = [
    {
      id: 1,
      nombre: 'BOMBÓN NAVIDAD EN BOLSA UNITARIA PERSONALIZADA',
      referencia: 'BE-015-156',
      imagen: 'assets/images/BE-015-156.jpg',
      medidas: 'Medidas 72 x 59 mm'
    },
    {
      id: 2,
      nombre: 'Bote personalizado con Bolas de Cereales con Chocolate',
      referencia: 'EN-148',
      imagen: 'assets/images/EN-148.jpg',
      medidas: 'Medidas 72 x 59 mm'
    },
    {
      id: 3,
      nombre: 'Bote personalizado con Catanias',
      referencia: 'EN-134',
      imagen: 'assets/images/EN-134.jpg',
      medidas: 'Medidas 72 x 59 mm'
    },
    {
      id: 4,
      nombre: 'Catánias 35g en estuche Medium Faja',
      referencia: 'SS-201-003',
      imagen: 'assets/images/SS-201-003.jpg',
      medidas: 'Medidas 60 x 60 x 55 mm'
    },
    {
      id: 5,
      nombre: 'Bombon de Yogur y Fresa cubo medium',
      referencia: 'SS-202',
      imagen: 'assets/images/SS-202.jpg',
      medidas: 'Medidas  60 x 40 x 55 mm'
    },
    {
      id: 6,
      nombre: 'Chocolates Levels Piramid',
      referencia: 'CO-000',
      imagen: 'assets/images/CO-000.jpg',
      medidas: 'Medidas 13 x 13 x 9,5 cm'
    }
  ];
}
