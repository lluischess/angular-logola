import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Interfaces para la configuración
export interface ConfiguracionGeneral {
  logoHeader?: string;
  logoFooter?: string;
  favicon?: string;
}

export interface ConfiguracionFooter {
  telefono?: string;
  email?: string;
  direccion?: string;
  horario?: string;
  descripcion?: string;
  instagram?: string;
}

export interface ConfiguracionSEO {
  metaTitulo?: string;
  metaDescripcion?: string;
  palabrasClave?: string;
  imagenPorDefecto?: string;
}

export interface ConfiguracionCompleta {
  general?: ConfiguracionGeneral;
  footer?: ConfiguracionFooter;
  seo?: ConfiguracionSEO;
  banners?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private readonly apiUrl = 'http://localhost:3000/configuration';

  // BehaviorSubject para mantener el estado de la configuración
  private configuracionSubject = new BehaviorSubject<ConfiguracionCompleta | null>(null);
  public configuracion$ = this.configuracionSubject.asObservable();

  constructor(private http: HttpClient) {
    //console.log('🔧 [CONFIGURACION-SERVICE] Servicio inicializado');
  }

  /**
   * Obtener toda la configuración desde el backend
   */
  getConfiguracion(): Observable<ConfiguracionCompleta> {
    //console.log('🔧 [CONFIGURACION-SERVICE] === OBTENIENDO CONFIGURACIÓN COMPLETA ===');

    // Hacer llamadas paralelas a todos los endpoints específicos con manejo de errores individual
    const footer$ = this.http.get<any>(`${this.apiUrl}/footer`).pipe(
      tap(response => console.log('🔧 [CONFIGURACION-SERVICE] Footer endpoint response:', response)),
      catchError(error => {
        console.error('❌ [CONFIGURACION-SERVICE] Error en endpoint footer:', error);
        return throwError(() => error);
      })
    );

    const general$ = this.http.get<any>(`${this.apiUrl}/general`).pipe(
      tap(response => console.log('🔧 [CONFIGURACION-SERVICE] General endpoint response:', response)),
      catchError(error => {
        console.error('❌ [CONFIGURACION-SERVICE] Error en endpoint general:', error);
        return throwError(() => error);
      })
    );

    const seo$ = this.http.get<any>(`${this.apiUrl}/seo`).pipe(
      tap(response => console.log('🔧 [CONFIGURACION-SERVICE] SEO endpoint response:', response)),
      catchError(error => {
        console.error('❌ [CONFIGURACION-SERVICE] Error en endpoint seo:', error);
        return throwError(() => error);
      })
    );

    const banners$ = this.http.get<any>(`${this.apiUrl}/banners`).pipe(
      tap(response => console.log('🔧 [CONFIGURACION-SERVICE] Banners endpoint response:', response)),
      catchError(error => {
        console.error('❌ [CONFIGURACION-SERVICE] Error en endpoint banners:', error);
        return throwError(() => error);
      })
    );

    return combineLatest([footer$, general$, seo$, banners$]).pipe(
      map(([footerResponse, generalResponse, seoResponse, bannersResponse]) => {
        //console.log('🔧 [CONFIGURACION-SERVICE] === RESPUESTAS DETALLADAS ===');
        //console.log('🔧 [CONFIGURACION-SERVICE] Footer response:', footerResponse);
        //console.log('🔧 [CONFIGURACION-SERVICE] General response:', generalResponse);
        //console.log('🔧 [CONFIGURACION-SERVICE] SEO response:', seoResponse);
        //console.log('🔧 [CONFIGURACION-SERVICE] Banners response:', bannersResponse);

        //console.log('🔧 [CONFIGURACION-SERVICE] === ESTRUCTURA DETALLADA DE DATOS ===');
        //console.log('🔧 [CONFIGURACION-SERVICE] Footer.datos:', footerResponse?.datos);
        //console.log('🔧 [CONFIGURACION-SERVICE] General.datos:', generalResponse?.datos);
        //console.log('🔧 [CONFIGURACION-SERVICE] SEO.datos:', seoResponse?.datos);

        // Mapear las respuestas al formato esperado (accediendo a .datos)
        const configuracion: ConfiguracionCompleta = {
          general: {
            logoHeader: generalResponse?.datos?.logoHeader,
            logoFooter: generalResponse?.datos?.logoFooter,
            favicon: generalResponse?.datos?.favicon
          },
          footer: {
            telefono: footerResponse?.datos?.telefono,
            email: footerResponse?.datos?.email,
            direccion: footerResponse?.datos?.direccion,
            horario: footerResponse?.datos?.horarioAtencion,
            descripcion: footerResponse?.datos?.contenidoFooter,
            instagram: footerResponse?.datos?.instagram
          },
          seo: {
            metaTitulo: seoResponse?.datos?.tituloPaginaPrincipal,
            metaDescripcion: seoResponse?.datos?.metaDescripcionPrincipal,
            palabrasClave: seoResponse?.datos?.palabrasClave,
            imagenPorDefecto: seoResponse?.datos?.imagenPorDefecto
          },
          banners: Array.isArray(bannersResponse) ? bannersResponse : []
        };

        //console.log('🔧 [CONFIGURACION-SERVICE] === CONFIGURACIÓN MAPEADA ===');
        //console.log('🔧 [CONFIGURACION-SERVICE] General:', configuracion.general);
        //console.log('🔧 [CONFIGURACION-SERVICE] Footer:', configuracion.footer);
        //console.log('🔧 [CONFIGURACION-SERVICE] SEO:', configuracion.seo);

        return configuracion;
      }),
      tap((configuracion: ConfiguracionCompleta) => {
        // Actualizar el BehaviorSubject con la nueva configuración
        this.configuracionSubject.next(configuracion);
      }),
      catchError(error => {
        console.error('❌ [CONFIGURACION-SERVICE] === ERROR OBTENIENDO CONFIGURACIÓN ===');
        console.error('❌ [CONFIGURACION-SERVICE] Error:', error);

        // Devolver configuración por defecto en caso de error
        const defaultConfig: ConfiguracionCompleta = {
          general: {
            logoHeader: 'assets/images/logo.png',
            logoFooter: 'assets/images/logo.png',
            favicon: 'assets/images/favicon.ico'
          },
          footer: {
            telefono: '(+34) 938 612 5568',
            email: 'info@logolate.com',
            direccion: 'La Garriga (Barcelona) Spain 08530',
            horario: 'Lunes a Viernes de 9:00 a 18:00',
            descripcion: 'En Logolate te ofrecemos chocolates personalizados de alta calidad...',
            instagram: 'https://www.instagram.com/logolate_spain/'
          },
          seo: {
            metaTitulo: 'Logolate - Chocolates Personalizados',
            metaDescripcion: 'Chocolates artesanales personalizados de alta calidad',
            palabrasClave: 'chocolates, personalizados, artesanales, logolate',
            imagenPorDefecto: 'assets/images/logo.png'
          },
          banners: []
        };

        this.configuracionSubject.next(defaultConfig);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener solo la configuración general (logos)
   */
  getConfiguracionGeneral(): Observable<ConfiguracionGeneral> {
    return this.getConfiguracion().pipe(
      map(config => config.general || {})
    );
  }

  /**
   * Obtener solo la configuración del footer
   */
  getConfiguracionFooter(): Observable<ConfiguracionFooter> {
    return this.getConfiguracion().pipe(
      map(config => config.footer || {})
    );
  }

  /**
   * Obtener solo la configuración SEO
   */
  getConfiguracionSEO(): Observable<ConfiguracionSEO> {
    return this.getConfiguracion().pipe(
      map(config => config.seo || {})
    );
  }

  /**
   * Obtener URL absoluta para imágenes
   */
  getAbsoluteImageUrl(relativePath: string): string {
    if (!relativePath) return '';

    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }

    if (relativePath.startsWith('assets/')) {
      return relativePath;
    }

    // Si es una ruta del backend, asegurar que tenga el protocolo
    if (relativePath.startsWith('/uploads/') || relativePath.includes('localhost:3000')) {
      return relativePath.startsWith('http') ? relativePath : `http://localhost:3000${relativePath}`;
    }

    return relativePath;
  }
}
