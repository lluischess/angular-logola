import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd, RouterModule, RouterOutlet } from '@angular/router';
import { CartComponent } from './cart/cart.component';
import { NavComponent } from './nav/nav.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { EndComponent } from './end/end.component';
import { CommonModule } from '@angular/common';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { OnDestroy } from '@angular/core';
import { ConfiguracionService } from './services/configuracion.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    CartComponent,
    NavComponent,
    HeaderComponent,
    FooterComponent,
    EndComponent,
    RouterModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'angular-logola';
  showHeaderFooter = true;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private configuracionService: ConfiguracionService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        // Hide header and footer for /logoadmin routes
        this.showHeaderFooter = !event.url.startsWith('/logoadmin');
      });

    // Check initial route
    this.showHeaderFooter = !this.router.url.startsWith('/logoadmin');

    // Load favicon from configuration
    this.loadFavicon();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFavicon() {
    //console.log('🔧 [APP] Cargando favicon desde configuración...');

    this.configuracionService.getConfiguracion()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          if (config?.general?.favicon) {
            //console.log('🔧 [APP] Favicon encontrado:', config.general.favicon);
            this.updateFavicon(config.general.favicon);
          } else {
            //console.log('🔧 [APP] No se encontró favicon en configuración, usando por defecto');
          }
        },
        error: (error) => {
          console.error('❌ [APP] Error cargando favicon:', error);
        }
      });
  }

  private updateFavicon(faviconUrl: string) {
    try {
      // Remove existing favicon
      const existingFavicon = this.document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.remove();
      }

      // Create new favicon link
      const link = this.document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/x-icon';
      link.href = faviconUrl;

      // Add to head
      this.document.head.appendChild(link);

      //console.log('✅ [APP] Favicon actualizado correctamente:', faviconUrl);
    } catch (error) {
      console.error('❌ [APP] Error actualizando favicon:', error);
    }
  }
}
