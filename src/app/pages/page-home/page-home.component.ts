import { Component } from '@angular/core';
import { BannerComponent } from "../../banner/banner.component";
import { NovedadesComponent } from "../../novedades/novedades.component";
import { PromoComponent } from "../../promo/promo.component";
import { SChocolatesComponent } from "../../s-chocolates/s-chocolates.component";
import { SCaramelosComponent } from "../../s-caramelos/s-caramelos.component";
import { VentajasComponent } from "../../ventajas/ventajas.component";

@Component({
  selector: 'app-page-home',
  standalone: true,
  imports: [BannerComponent, NovedadesComponent, PromoComponent, SChocolatesComponent, SCaramelosComponent, VentajasComponent],
  templateUrl: './page-home.component.html',
  styleUrl: './page-home.component.css'
})
export class PageHomeComponent {

}
