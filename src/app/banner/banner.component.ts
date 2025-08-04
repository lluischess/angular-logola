import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConfigurationService } from '../shared/back/backoffice/services/configuration.service';

// Interfaz para los banners dinámicos (mapeados desde el backend)
interface BannerData {
  id: string | number;
  titulo: string;
  subtitulo: string;
  imagen: string;
  imagenMobile: string;
  enlace: string;
  activo: boolean;
  orden: number;
  nombreBoton: string;
  colorBoton: string;
  colorTitulos: string;
}

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.css'
})
export class BannerComponent implements OnInit, OnDestroy {
  currentSlide: number = 0;
  offset: number = 0;
  intervalId: any;
  
  // Banners dinámicos del backend
  banners: BannerData[] = [];
  isLoading = true;
  totalSlides = 0;
  
  constructor(private configurationService: ConfigurationService) {}

  ngOnInit() {
    this.loadBanners();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  /**
   * Cargar banners dinámicos del backend
   */
  loadBanners(): void {
    console.log('🎨 [BANNER] Cargando banners dinámicos del backend...');
    this.isLoading = true;
    
    this.configurationService.getConfigurationSection('banners').subscribe({
      next: (response: any) => {
        console.log('✅ [BANNER] Respuesta completa del backend:', response);
        console.log('🔍 [BANNER] Tipo de respuesta:', typeof response);
        console.log('🔍 [BANNER] Keys de la respuesta:', Object.keys(response || {}));
        
        // Extraer banners de la respuesta con múltiples intentos
        let bannersData = [];
        
        if (Array.isArray(response)) {
          console.log('📋 [BANNER] Respuesta es un array directo');
          bannersData = response;
        } else if (response?.banners) {
          console.log('📋 [BANNER] Banners encontrados en response.banners');
          bannersData = response.banners;
        } else if (response?.banner?.banners) {
          console.log('📋 [BANNER] Banners encontrados en response.banner.banners');
          bannersData = response.banner.banners;
        } else if (response?.data) {
          console.log('📋 [BANNER] Banners encontrados en response.data');
          bannersData = response.data;
        } else {
          console.log('📋 [BANNER] Estructura de respuesta no reconocida, usando respuesta completa');
          bannersData = response || [];
        }
        
        console.log('📊 [BANNER] Banners extraídos:', bannersData);
        console.log('📊 [BANNER] Número de banners:', bannersData.length);
        
        // Mostrar cada banner individual para debugging
        bannersData.forEach((banner: any, index: number) => {
          console.log(`🎨 [BANNER] Banner ${index + 1}:`, {
            id: banner.id,
            titulo: banner.titulo,
            subtitulo: banner.subtitulo,
            nombreBoton: banner.nombreBoton,
            colorTitulos: banner.colorTitulos,
            colorBoton: banner.colorBoton,
            activo: banner.activo,
            orden: banner.orden,
            'TODAS_LAS_PROPIEDADES': Object.keys(banner),
            'OBJETO_COMPLETO': banner
          });
        });
        
        // Mapear y filtrar banners activos
        this.banners = bannersData
          .filter((bannerConfig: any) => {
            const isActive = this.isBannerActive(bannerConfig.activo);
            console.log(`🔍 [BANNER] Banner "${bannerConfig.datos?.titulo || bannerConfig.titulo}" activo: ${bannerConfig.activo} -> ${isActive}`);
            return isActive;
          })
          .map((bannerConfig: any) => {
            // Mapear propiedades del backend al formato esperado por el frontend
            const datos = bannerConfig.datos || bannerConfig;
            
            console.log('🔍 [BANNER] Mapeando banner:', {
              'bannerConfig_completo': bannerConfig,
              'datos_extraidos': datos,
              'propiedades_datos': Object.keys(datos || {})
            });
            
            // Intentar múltiples estructuras posibles de datos
            const mappedBanner = {
              id: bannerConfig._id || bannerConfig.id,
              titulo: datos.titulo || bannerConfig.titulo,
              subtitulo: datos.subtitulo || bannerConfig.subtitulo,
              imagen: datos.imagenDesktop || datos.imagen || bannerConfig.imagen,
              imagenMobile: datos.imagenMobile || bannerConfig.imagenMobile,
              enlace: datos.enlaceButton || datos.enlace || bannerConfig.enlace,
              nombreBoton: datos.nombreButton || datos.nombreBoton || bannerConfig.nombreBoton || datos.textoBoton || 'Ver Más',
              colorBoton: datos.colorBoton || bannerConfig.colorBoton || datos.colorButton || '#3B82F6',
              colorTitulos: datos.colorTitulos || bannerConfig.colorTitulos || datos.colorTexto || '#FFFFFF',
              orden: datos.ordenBanner || datos.orden || bannerConfig.orden || 1,
              activo: bannerConfig.activo !== false
            } as BannerData;
            
            console.log('🔄 [BANNER] Banner mapeado:', mappedBanner);
            return mappedBanner;
          })
          .sort((a: BannerData, b: BannerData) => a.orden - b.orden);
        
        console.log('🚀 [BANNER] Banners activos filtrados y ordenados:', this.banners);
        
        this.totalSlides = this.banners.length;
        this.isLoading = false;
        
        // Resetear posición del carousel
        this.currentSlide = 0;
        this.offset = 0;
        
        // Iniciar auto-slide si hay banners
        if (this.totalSlides > 1) {
          this.startAutoSlide();
        }
      },
      error: (error) => {
        console.error('❌ [BANNER] Error cargando banners:', error);
        this.isLoading = false;
        // En caso de error, usar datos por defecto (vacío)
        this.banners = [];
        this.totalSlides = 0;
      }
    });
  }

  startAutoSlide() {
    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 25000);
  }

  nextSlide() {
    if (this.totalSlides === 0) return;
    
    this.currentSlide += 1;

    // Cuando llegamos al final, regresamos al primer slide
    if (this.currentSlide >= this.totalSlides) {
        this.currentSlide = 0;
    }

    // Calcular el offset simple
    this.offset = -this.currentSlide * 100;
  }

  prevSlide() {
    if (this.totalSlides === 0) return;
    
    this.currentSlide -= 1;

    // Cuando llegamos al primer slide, volvemos al último
    if (this.currentSlide < 0) {
        this.currentSlide = this.totalSlides - 1;
    }

    // Calcular el offset simple
    this.offset = -this.currentSlide * 100;
  }



  /**
   * Obtener URL de imagen para desktop
   */
  getDesktopImageUrl(banner: BannerData): string {
    if (!banner.imagen) return 'assets/images/ChocoBanner.jpg'; // Fallback
    
    // Si ya es una URL completa, usarla tal como está
    if (banner.imagen.startsWith('http')) {
      return banner.imagen;
    }
    
    // Si empieza con /uploads, construir URL completa del backend
    if (banner.imagen.startsWith('/uploads')) {
      return `http://localhost:3000${banner.imagen}`;
    }
    
    // Si es una ruta relativa, asumir que está en assets
    if (banner.imagen.startsWith('assets/')) {
      return banner.imagen;
    }
    
    // Fallback: construir URL del backend
    return `http://localhost:3000/uploads/banners/${banner.imagen}`;
  }

  /**
   * Obtener URL de imagen para mobile
   */
  getMobileImageUrl(banner: BannerData): string {
    if (!banner.imagenMobile) return this.getDesktopImageUrl(banner); // Usar desktop como fallback
    
    // Si ya es una URL completa, usarla tal como está
    if (banner.imagenMobile.startsWith('http')) {
      return banner.imagenMobile;
    }
    
    // Si empieza con /uploads, construir URL completa del backend
    if (banner.imagenMobile.startsWith('/uploads')) {
      return `http://localhost:3000${banner.imagenMobile}`;
    }
    
    // Si es una ruta relativa, asumir que está en assets
    if (banner.imagenMobile.startsWith('assets/')) {
      return banner.imagenMobile;
    }
    
    // Fallback: construir URL del backend
    return `http://localhost:3000/uploads/banners/${banner.imagenMobile}`;
  }

  /**
   * Obtener estilos dinámicos para el banner
   */
  getBannerStyles(banner: BannerData): any {
    return {
      'background-image': `url('${this.getDesktopImageUrl(banner)}')`,
      'background-repeat': 'no-repeat',
      'background-size': 'cover'
    };
  }

  /**
   * Obtener estilos para el texto del banner
   */
  getTextStyles(banner: BannerData): any {
    return {
      'color': banner.colorTitulos || '#000000'
    };
  }

  /**
   * Obtener estilos para el botón del banner
   */
  getButtonStyles(banner: BannerData): any {
    return {
      'background-color': banner.colorBoton || '#3B82F6',
      'border-color': banner.colorBoton || '#3B82F6',
      'color': '#FFFFFF' // Texto del botón siempre blanco
    };
  }

  /**
   * Verificar si un banner está activo (maneja diferentes tipos de datos)
   */
  private isBannerActive(activo: any): boolean {
    if (typeof activo === 'boolean') {
      return activo;
    }
    if (typeof activo === 'string') {
      return activo === 'true' || activo === '1';
    }
    if (typeof activo === 'number') {
      return activo === 1;
    }
    return false;
  }
}
