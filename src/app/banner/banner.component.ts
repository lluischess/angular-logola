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
  // Segundo botón opcional
  enlaceButton2?: string;
  nombreButton2?: string;
  colorBoton2?: string;
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
    //console.log('🎨 [BANNER] Cargando banners dinámicos del backend...');
    this.isLoading = true;

    this.configurationService.getConfigurationSection('banners').subscribe({
      next: (response: any) => {
        //console.log('✅ [BANNER] Respuesta completa del backend:', response);
        //console.log('🔍 [BANNER] Tipo de respuesta:', typeof response);
        //console.log('🔍 [BANNER] Keys de la respuesta:', Object.keys(response || {}));

        // Extraer banners de la respuesta con múltiples intentos
        let bannersData = [];

        if (Array.isArray(response)) {
          //console.log('📋 [BANNER] Respuesta es un array directo');
          bannersData = response;
        } else if (response?.banners) {
          //console.log('📋 [BANNER] Banners encontrados en response.banners');
          bannersData = response.banners;
        } else if (response?.banner?.banners) {
          //console.log('📋 [BANNER] Banners encontrados en response.banner.banners');
          bannersData = response.banner.banners;
        } else if (response?.data) {
          //console.log('📋 [BANNER] Banners encontrados en response.data');
          bannersData = response.data;
        } else {
          //console.log('📋 [BANNER] Estructura de respuesta no reconocida, usando respuesta completa');
          bannersData = response || [];
        }

        //console.log('📊 [BANNER] Banners extraídos:', bannersData);
        //console.log('📊 [BANNER] Número de banners:', bannersData.length);

        // Mostrar cada banner individual para debugging
        bannersData.forEach((banner: any, index: number) => {
          // console.log(`🎨 [BANNER] Banner ${index + 1}:`, {
          //   id: banner.id,
          //   titulo: banner.titulo,
          //   subtitulo: banner.subtitulo,
          //   nombreBoton: banner.nombreBoton,
          //   colorTitulos: banner.colorTitulos,
          //   colorBoton: banner.colorBoton,
          //   activo: banner.activo,
          //   orden: banner.orden,
          //   'TODAS_LAS_PROPIEDADES': Object.keys(banner),
          //   'OBJETO_COMPLETO': banner
          // });
        });

        // Mapear y filtrar banners activos
        this.banners = bannersData
          .filter((banner: any) => this.isBannerActive(banner.datos?.activo))
          .map((bannerConfig: any, index: number) => {
            //console.log(`🎨 [BANNER] Procesando banner ${index + 1}:`, bannerConfig);
            //console.log(`🔍 [BANNER] Datos del banner:`, bannerConfig.datos);

            const mappedBanner: BannerData = {
              id: bannerConfig._id || `banner-${index}`,
              titulo: bannerConfig.datos?.titulo || '',
              subtitulo: bannerConfig.datos?.subtitulo || '',
              imagen: this.getDesktopImageUrl(bannerConfig.datos),
              imagenMobile: this.getMobileImageUrl(bannerConfig.datos),
              enlace: bannerConfig.datos?.enlaceButton || bannerConfig.datos?.enlace || '',
              activo: this.isBannerActive(bannerConfig.datos?.activo),
              orden: bannerConfig.datos?.ordenBanner || bannerConfig.datos?.orden || (index + 1),
              nombreBoton: bannerConfig.datos?.nombreButton || bannerConfig.datos?.nombreBoton || 'Ver Más',
              colorBoton: bannerConfig.datos?.colorBoton || '#3B82F6',
              colorTitulos: bannerConfig.datos?.colorTitulos || '#FFFFFF',
              // Segundo botón opcional
              enlaceButton2: bannerConfig.datos?.enlaceButton2 || '',
              nombreButton2: bannerConfig.datos?.nombreButton2 || '',
              colorBoton2: bannerConfig.datos?.colorBoton2 || ''
            };

            //console.log(`✅ [BANNER] Banner ${index + 1} mapeado COMPLETO:`, mappedBanner);
            // console.log(`🔍 [BANNER] Segundo botón debug:`, {
            //   enlaceButton2_original: bannerConfig.datos?.enlaceButton2,
            //   nombreButton2_original: bannerConfig.datos?.nombreButton2,
            //   colorBoton2_original: bannerConfig.datos?.colorBoton2,
            //   enlaceButton2_mapeado: mappedBanner.enlaceButton2,
            //   nombreButton2_mapeado: mappedBanner.nombreButton2,
            //   colorBoton2_mapeado: mappedBanner.colorBoton2,
            //   condicion_mostrar: !!(mappedBanner.enlaceButton2 && mappedBanner.nombreButton2)
            // });
            // console.log(`🖼️ [BANNER] Imágenes debug Banner ${index + 1}:`, {
            //   imagenDesktop_original: bannerConfig.datos?.imagenDesktop,
            //   imagenMobile_original: bannerConfig.datos?.imagenMobile,
            //   imagen_mapeada_desktop: mappedBanner.imagen,
            //   imagen_mapeada_mobile: mappedBanner.imagenMobile,
            //   bannerConfig_completo: bannerConfig
            // });
            return mappedBanner;
          })
          .sort((a: BannerData, b: BannerData) => a.orden - b.orden);

        //console.log('🚀 [BANNER] Banners activos filtrados y ordenados:', this.banners);

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
  getDesktopImageUrl(bannerData: any): string {
    const imagenDesktop = bannerData?.imagenDesktop;

    if (!imagenDesktop) return 'assets/images/ChocoBanner.jpg'; // Fallback

    // Si ya es una URL completa, usarla tal como está
    if (imagenDesktop.startsWith('http')) {
      return imagenDesktop;
    }

    // Si empieza con /uploads, construir URL completa del backend
    if (imagenDesktop.startsWith('/uploads')) {
      return `http://localhost:3000${imagenDesktop}`;
    }

    // Si es una ruta relativa, asumir que está en assets
    if (imagenDesktop.startsWith('assets/')) {
      return imagenDesktop;
    }

    // Fallback: construir URL del backend
    return `http://localhost:3000/uploads/banners/${imagenDesktop}`;
  }

  /**
   * Obtener URL de imagen para mobile
   */
  getMobileImageUrl(bannerData: any): string {
    const imagenMobile = bannerData?.imagenMobile;

    if (!imagenMobile) return this.getDesktopImageUrl(bannerData); // Usar desktop como fallback

    // Si ya es una URL completa, usarla tal como está
    if (imagenMobile.startsWith('http')) {
      return imagenMobile;
    }

    // Si empieza con /uploads, construir URL completa del backend
    if (imagenMobile.startsWith('/uploads')) {
      return `http://localhost:3000${imagenMobile}`;
    }

    // Si es una ruta relativa, asumir que está en assets
    if (imagenMobile.startsWith('assets/')) {
      return imagenMobile;
    }

    // Fallback: construir URL del backend
    return `http://localhost:3000/uploads/banners/${imagenMobile}`;
  }

  /**
   * Obtener estilos dinámicos para el banner
   */
  getBannerStyles(banner: BannerData): any {
    return {
      'background-image': `url('${banner.imagen}')`,
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
   * Obtener estilos para el segundo botón del banner
   */
  getSecondButtonStyles(banner: BannerData): any {
    return {
      'background-color': banner.colorBoton2 || '#6B7280',
      'border-color': banner.colorBoton2 || '#6B7280',
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
