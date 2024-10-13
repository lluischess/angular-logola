import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CartComponent } from './cart/cart.component';
import { NavComponent } from './nav/nav.component';
import { HeaderComponent } from './header/header.component';
import { BannerComponent } from './banner/banner.component';
import { NovedadesComponent } from './novedades/novedades.component';
import { PromoComponent } from './promo/promo.component';
import { VentajasComponent } from './ventajas/ventajas.component';
import { FooterComponent } from './footer/footer.component';
import { EndComponent } from './end/end.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CartComponent,
    NavComponent,
    HeaderComponent,
    BannerComponent,
    NovedadesComponent,
    PromoComponent,
    VentajasComponent,
    FooterComponent,
    EndComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'angular-logola';
}
