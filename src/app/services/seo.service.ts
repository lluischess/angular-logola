import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

export interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  constructor(
    private titleService: Title,
    private metaService: Meta
  ) { }

  /**
   * Construye una URL canónica absoluta usando el siteUrl del environment.
   * En dev: http://localhost:4200/ruta
   * En prod: https://logolate.com/ruta
   */
  buildCanonicalUrl(path: string): string {
    const base = environment.siteUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  }

  /**
   * Actualizar todos los metadatos SEO de la página
   */
  updateSeoMetadata(metadata: SeoMetadata): void {
    // Título de la página
    if (metadata.title) {
      this.titleService.setTitle(metadata.title);
    }

    // Meta descripción
    if (metadata.description) {
      this.metaService.updateTag({ name: 'description', content: metadata.description });
    }

    // Meta keywords
    if (metadata.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: metadata.keywords });
    }

    // Open Graph título
    if (metadata.ogTitle) {
      this.metaService.updateTag({ property: 'og:title', content: metadata.ogTitle });
    }

    // Open Graph descripción
    if (metadata.ogDescription) {
      this.metaService.updateTag({ property: 'og:description', content: metadata.ogDescription });
    }

    // Open Graph imagen
    if (metadata.ogImage) {
      const imageUrl = this.getAbsoluteImageUrl(metadata.ogImage);
      this.metaService.updateTag({ property: 'og:image', content: imageUrl });
    }

    // URL canónica
    if (metadata.canonical) {
      this.updateCanonicalUrl(metadata.canonical);
    }

    // Metadatos adicionales de Open Graph
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Logolate' });
  }

  /**
   * Limpiar metadatos SEO (útil para resetear antes de cargar nuevos)
   */
  clearSeoMetadata(): void {
    this.metaService.removeTag('name="description"');
    this.metaService.removeTag('name="keywords"');
    this.metaService.removeTag('property="og:title"');
    this.metaService.removeTag('property="og:description"');
    this.metaService.removeTag('property="og:image"');
  }

  /**
   * Actualizar URL canónica
   */
  private updateCanonicalUrl(url: string): void {
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }

    canonicalLink.setAttribute('href', url);
  }

  /**
   * Convertir URL relativa a absoluta para imágenes
   */
  private getAbsoluteImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';

    if (imageUrl.includes('localhost:3000')) {
      return imageUrl.replace('http://localhost:3000', environment.apiUrl);
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/uploads')) {
      return `${environment.apiUrl}${imageUrl}`;
    }

    if (imageUrl.startsWith('assets/')) {
      return `/${imageUrl}`;
    }

    return `${environment.apiUrl}/uploads/images/${imageUrl}`;
  }

  /**
   * Metadatos por defecto (fallback cuando no hay config del backend)
   */
  setDefaultMetadata(): void {
    const defaultMetadata: SeoMetadata = {
      title: 'Logolate - Chocolates Personalizados para Hoteles y Empresas',
      description: 'Chocolates y bombones personalizados con tu logo para hoteles, empresas y eventos. Pedidos desde 100 unidades. Entrega en 10-15 días.',
      keywords: 'chocolates personalizados, bombones personalizados empresa, regalos corporativos chocolate, chocolates para hoteles, chocolate personalizado logo',
      ogTitle: 'Logolate - Chocolates Personalizados para Hoteles y Empresas',
      ogDescription: 'Chocolates y bombones personalizados con tu logo para hoteles, empresas y eventos. Pedidos desde 100 unidades. Entrega en 10-15 días.',
      canonical: this.buildCanonicalUrl('/')
    };

    this.updateSeoMetadata(defaultMetadata);
  }

  /**
   * Inyectar un bloque JSON-LD de schema.org en el <head>.
   * Reemplaza cualquier script JSON-LD previo para evitar duplicados.
   */
  injectJsonLd(schema: object): void {
    this.removeJsonLd();

    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('id', 'jsonld-schema');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /**
   * Eliminar el bloque JSON-LD del <head> (llamar en ngOnDestroy).
   */
  removeJsonLd(): void {
    const existing = document.getElementById('jsonld-schema');
    if (existing) {
      existing.remove();
    }
  }
}
