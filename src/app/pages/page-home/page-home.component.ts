import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
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
  imports: [RouterModule, BannerComponent, NovedadesComponent, PromoComponent, SChocolatesComponent, SCaramelosComponent, VentajasComponent],
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
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.seoService.removeJsonLd();
  }

  /**
   * Cargar metadatos SEO desde la configuración del backend
   */
  private loadSeoMetadata(): void {
    const sub = this.configurationService.getConfiguration().subscribe({
      next: (config: ConfigurationData) => {
        if (config && config.seo) {
          const seoMetadata: SeoMetadata = {
            title: config.seo.homeTitle || 'Logolate - Chocolates Personalizados para Hoteles y Empresas',
            description: config.seo.homeDescription || 'Chocolates y bombones personalizados con tu logo para hoteles, empresas y eventos. Pedidos desde 100 unidades. Entrega en 10-15 días.',
            keywords: config.seo.homeKeywords || 'chocolates personalizados, bombones personalizados empresa, regalos corporativos chocolate, chocolates para hoteles, chocolate personalizado logo',
            ogTitle: config.seo.homeTitle || 'Logolate - Chocolates Personalizados para Hoteles y Empresas',
            ogDescription: config.seo.homeDescription || 'Chocolates y bombones personalizados con tu logo para hoteles, empresas y eventos. Pedidos desde 100 unidades. Entrega en 10-15 días.',
            ogImage: config.seo.defaultImage || '',
            canonical: this.seoService.buildCanonicalUrl('/')
          };

          this.seoService.updateSeoMetadata(seoMetadata);
        } else {
          this.seoService.setDefaultMetadata();
        }

        this.injectOrganizationSchema(config);
      },
      error: () => {
        this.seoService.setDefaultMetadata();
        this.injectOrganizationSchema(null);
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Inyectar schema.org/Organization con datos de la empresa
   */
  private injectOrganizationSchema(config: ConfigurationData | null): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Logolate',
      url: 'https://logolate.com',
      logo: 'https://logolate.com/assets/images/logo.png',
      description: 'Más de 35 años fabricando chocolates y bombones personalizados para hoteles, empresas y eventos. Pedidos desde 100 unidades, envío a toda España.',
      telephone: config?.footer?.contactoTelefono || '+34938612858',
      email: config?.footer?.contactoEmail || 'info@logolate.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'La Garriga',
        addressLocality: 'La Garriga',
        addressRegion: 'Barcelona',
        postalCode: '08530',
        addressCountry: 'ES'
      },
      sameAs: [
        config?.footer?.redesSociales?.instagram || 'https://www.instagram.com/logolate'
      ]
    };

    this.seoService.injectJsonLd(schema);
  }
}
