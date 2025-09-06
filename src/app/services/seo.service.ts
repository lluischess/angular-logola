import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
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
   * Actualizar todos los metadatos SEO de la página
   */
  updateSeoMetadata(metadata: SeoMetadata): void {
    //console.log(' [SEO] === INICIANDO ACTUALIZACIÓN DE METADATOS ===');
    //console.log(' [SEO] Metadatos recibidos:', metadata);

    // Título de la página
    if (metadata.title) {
      //console.log(' [SEO] Actualizando título:', metadata.title);
      this.titleService.setTitle(metadata.title);
      //console.log(' [SEO] Título actual en DOM:', document.title);
    }

    // Meta descripción
    if (metadata.description) {
      //console.log(' [SEO] Actualizando descripción:', metadata.description);
      this.metaService.updateTag({ name: 'description', content: metadata.description });
      const descTag = document.querySelector('meta[name="description"]');
      //console.log(' [SEO] Descripción actual en DOM:', descTag?.getAttribute('content'));
    }

    // Meta keywords
    if (metadata.keywords) {
      //console.log(' [SEO] Actualizando keywords:', metadata.keywords);
      this.metaService.updateTag({ name: 'keywords', content: metadata.keywords });
      const keyTag = document.querySelector('meta[name="keywords"]');
      //console.log(' [SEO] Keywords actuales en DOM:', keyTag?.getAttribute('content'));
    }

    // Open Graph título
    if (metadata.ogTitle) {
      //console.log(' [SEO] Actualizando OG title:', metadata.ogTitle);
      this.metaService.updateTag({ property: 'og:title', content: metadata.ogTitle });
    }

    // Open Graph descripción
    if (metadata.ogDescription) {
      //console.log(' [SEO] Actualizando OG description:', metadata.ogDescription);
      this.metaService.updateTag({ property: 'og:description', content: metadata.ogDescription });
    }

    // Open Graph imagen
    if (metadata.ogImage) {
      const imageUrl = this.getAbsoluteImageUrl(metadata.ogImage);
      //console.log(' [SEO] Actualizando OG image:', imageUrl);
      this.metaService.updateTag({ property: 'og:image', content: imageUrl });
    }

    // URL canónica
    if (metadata.canonical) {
      this.updateCanonicalUrl(metadata.canonical);
    }

    // Metadatos adicionales de Open Graph
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Logolate' });

    //console.log('🔍 [SEO] Metadatos actualizados:', metadata);
  }

  /**
   * Limpiar metadatos SEO (útil para resetear antes de cargar nuevos)
   */
  clearSeoMetadata(): void {
    // Remover metadatos existentes
    this.metaService.removeTag('name="description"');
    this.metaService.removeTag('name="keywords"');
    this.metaService.removeTag('property="og:title"');
    this.metaService.removeTag('property="og:description"');
    this.metaService.removeTag('property="og:image"');

    //console.log('🧹 [SEO] Metadatos limpiados');
  }

  /**
   * Actualizar URL canónica
   */
  private updateCanonicalUrl(url: string): void {
    // Buscar link canónico existente
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

    if (!canonicalLink) {
      // Crear link canónico si no existe
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

    // Si ya es una URL completa, usarla tal como está
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // Si empieza con /uploads, construir URL completa del backend
    if (imageUrl.startsWith('/uploads')) {
      return `${environment.apiUrl}${imageUrl}`;
    }

    // Si es una ruta relativa, asumir que está en assets
    if (imageUrl.startsWith('assets/')) {
      return `http://localhost:4200/${imageUrl}`;
    }

    // Fallback: construir URL del backend
    return `${environment.apiUrl}/uploads/images/${imageUrl}`;
  }

  /**
   * Generar metadatos por defecto para la aplicación
   */
  setDefaultMetadata(): void {
    const defaultMetadata: SeoMetadata = {
      title: 'Logolate - Chocolates y Caramelos Artesanales',
      description: 'Descubre los mejores chocolates y caramelos artesanales. Productos únicos y de calidad premium.',
      keywords: 'chocolates, caramelos, artesanales, premium, dulces, logolate',
      ogTitle: 'Logolate - Chocolates y Caramelos Artesanales',
      ogDescription: 'Descubre los mejores chocolates y caramelos artesanales. Productos únicos y de calidad premium.'
    };

    this.updateSeoMetadata(defaultMetadata);
  }
}
