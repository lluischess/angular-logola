import { Component, OnInit, OnDestroy } from '@angular/core';
import { BannerComponent } from "../../banner/banner.component";
import { NovedadesComponent } from "../../novedades/novedades.component";
import { PromoComponent } from "../../promo/promo.component";
import { SChocolatesComponent } from "../../s-chocolates/s-chocolates.component";
import { SCaramelosComponent } from "../../s-caramelos/s-caramelos.component";
import { VentajasComponent } from "../../ventajas/ventajas.component";
import { SeoService, SeoMetadata } from '../../services/seo.service';
import { ConfigurationService, ConfigurationData } from '../../shared/back/backoffice/services/configuration.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-page-home',
  standalone: true,
  imports: [BannerComponent, NovedadesComponent, PromoComponent, SChocolatesComponent, SCaramelosComponent, VentajasComponent],
  templateUrl: './page-home.component.html',
  styleUrl: './page-home.component.css'
})
export class PageHomeComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  constructor(
    private seoService: SeoService,
    private configurationService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.loadSeoMetadata();
  }

  ngOnDestroy(): void {
    // Limpiar subscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Cargar metadatos SEO desde la configuración
   */
  private loadSeoMetadata(): void {
    console.log('🏠 [HOME] Cargando metadatos SEO desde configuración...');
    
    const sub = this.configurationService.getConfiguration().subscribe({
      next: (config: ConfigurationData) => {
        console.log('🏠 [HOME] Configuración recibida:', config);
        console.log('🏠 [HOME] config.seo existe:', !!config?.seo);
        console.log('🏠 [HOME] config.seo completo:', config?.seo);
        
        if (config && config.seo) {
          console.log('🏠 [HOME] Campos SEO individuales:');
          console.log('  - homeTitle:', config.seo.homeTitle);
          console.log('  - homeDescription:', config.seo.homeDescription);
          console.log('  - homeKeywords:', config.seo.homeKeywords);
          console.log('  - siteName:', config.seo.siteName);
          console.log('  - defaultImage:', config.seo.defaultImage);
          
          const seoMetadata: SeoMetadata = {
            title: config.seo.homeTitle || 'Logolate - Chocolates y Caramelos Artesanales',
            description: config.seo.homeDescription || 'Descubre los mejores chocolates y caramelos artesanales. Productos únicos y de calidad premium.',
            keywords: config.seo.homeKeywords || 'chocolates, caramelos, artesanales, premium, dulces, logolate',
            ogTitle: config.seo.homeTitle || 'Logolate - Chocolates y Caramelos Artesanales',
            ogDescription: config.seo.homeDescription || 'Descubre los mejores chocolates y caramelos artesanales. Productos únicos y de calidad premium.',
            ogImage: config.seo.defaultImage || '',
            canonical: 'http://localhost:4200/'
          };

          // Aplicar metadatos SEO
          this.seoService.updateSeoMetadata(seoMetadata);
          console.log('🏠 [HOME] Metadatos SEO aplicados:', seoMetadata);
        } else {
          console.log('🏠 [HOME] No hay configuración SEO, usando metadatos por defecto');
          this.seoService.setDefaultMetadata();
        }
      },
      error: (error: any) => {
        console.error('❌ [HOME] Error cargando configuración SEO:', error);
        console.error('❌ [HOME] Error status:', error.status);
        console.error('❌ [HOME] Error message:', error.message);
        console.error('❌ [HOME] Error URL:', error.url);
        
        if (error.status === 0) {
          console.error('❌ [HOME] Backend no está disponible o CORS error');
        } else if (error.status === 404) {
          console.error('❌ [HOME] Endpoint /configuration no encontrado');
        }
        
        // En caso de error, usar metadatos por defecto
        this.seoService.setDefaultMetadata();
      }
    });

    this.subscriptions.push(sub);
  }
}
