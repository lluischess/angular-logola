import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cookies-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookies-banner.component.html',
  styleUrls: ['./cookies-banner.component.css']
})
export class CookiesBannerComponent implements OnInit {
  
  showBanner = false;

  ngOnInit(): void {
    // Verificar si el usuario ya ha respondido a las cookies
    const cookiesAccepted = localStorage.getItem('cookies-accepted');
    if (!cookiesAccepted) {
      // Mostrar el banner después de un pequeño delay para mejor UX
      setTimeout(() => {
        this.showBanner = true;
      }, 1000);
    }
  }

  /**
   * Aceptar cookies
   */
  acceptCookies(): void {
    localStorage.setItem('cookies-accepted', 'true');
    this.hideBanner();
  }

  /**
   * Rechazar cookies
   */
  rejectCookies(): void {
    localStorage.setItem('cookies-accepted', 'false');
    this.hideBanner();
  }

  /**
   * Ocultar el banner con animación
   */
  private hideBanner(): void {
    this.showBanner = false;
  }
}
