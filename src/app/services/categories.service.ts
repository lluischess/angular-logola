import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Interfaz para las categorías del FrontOffice
export interface FrontCategory {
  _id: string;
  nombre: string;
  slug: string;
  urlSlug?: string; // Campo que devuelve el backend
  publicado: boolean;
  orden: number;
  descripcion?: string; // Campo descripción de la categoría
  // Campos SEO directos desde la BD (coinciden con el esquema del backend)
  metaTitulo?: string;
  metaDescripcion?: string;
  palabrasClave?: string;
  ogTitulo?: string;
  ogDescripcion?: string;
  ogImagen?: string;
  color?: string;
  configuracionEspecial?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private apiUrl = 'http://localhost:3000/categories';

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las categorías publicadas para el FrontOffice
   */
  getPublishedCategories(): Observable<FrontCategory[]> {
    console.log('🔄 [CATEGORIES-SERVICE] Cargando categorías publicadas...');
    
    return this.http.get<any>(`${this.apiUrl}?publicado=true&sortBy=orden&sortOrder=asc`)
      .pipe(
        map(response => {
          console.log('✅ [CATEGORIES-SERVICE] Respuesta del backend:', response);
          
          // Extraer las categorías de la respuesta
          const categories = response.categories || response.data || response;
          
          console.log('🔍 [CATEGORIES-SERVICE] Datos crudos del backend:', categories);
          
          if (Array.isArray(categories)) {
            // Filtrar solo categorías publicadas, generar slug si no existe, y ordenar por campo orden
            const publishedCategories = categories
              .filter(cat => cat.publicado === true)
              .map(cat => {
                // Generar slug automáticamente si no existe
                if (!cat.slug || cat.slug.trim() === '') {
                  cat.slug = this.generateSlug(cat.nombre);
                  console.log(`🔧 [CATEGORIES-SERVICE] Slug generado para "${cat.nombre}": ${cat.slug}`);
                }
                return cat;
              })
              .sort((a, b) => (a.orden || 0) - (b.orden || 0));
            
            console.log('📂 [CATEGORIES-SERVICE] Categorías procesadas:', publishedCategories);
            return publishedCategories;
          } else {
            console.warn('⚠️ [CATEGORIES-SERVICE] Respuesta no es un array:', categories);
            return [];
          }
        }),
        catchError(error => {
          console.error('❌ [CATEGORIES-SERVICE] Error cargando categorías:', error);
          
          // Fallback: devolver categorías por defecto
          return of(this.getDefaultCategories());
        })
      );
  }

  /**
   * Obtener una categoría por slug
   */
  getCategoryBySlug(slug: string): Observable<FrontCategory | null> {
    console.log(`🔍 [CATEGORIES-SERVICE] Buscando categoría por slug: ${slug}`);
    
    return this.http.get<any>(`${this.apiUrl}/slug/${slug}`)
      .pipe(
        map(response => {
          console.log('🔍 [CATEGORIES-SERVICE] Respuesta del backend:', response);
          // El endpoint /slug/:slug devuelve directamente la categoría, no un array
          return response || null;
        }),
        catchError(error => {
          console.error('Error obteniendo categoría por slug:', error);
          return of(null);
        })
      );
  }

  /**
   * Obtener la categoría marcada como "Configuración Especial"
   */
  getSpecialCategory(): Observable<FrontCategory | null> {
    console.log('🎯 [CATEGORIES-SERVICE] Buscando categoría especial...');
    
    // Usar HttpParams para construir correctamente los parámetros de query
    const params = {
      configuracionEspecial: 'true',
      publicado: 'true',
      limit: '1' // Solo necesitamos una categoría especial
    };
    
    console.log('🎯 [CATEGORIES-SERVICE] Parámetros de consulta:', params);
    
    return this.http.get<any>(this.apiUrl, { params })
      .pipe(
        map(response => {
          console.log('🎯 [CATEGORIES-SERVICE] Respuesta completa:', response);
          
          // El backend devuelve { categories: [...], pagination: {...} }
          const categories = response.categories || [];
          
          console.log('🎯 [CATEGORIES-SERVICE] Categorías encontradas:', categories.length);
          
          if (Array.isArray(categories) && categories.length > 0) {
            const specialCategory = categories[0]; // Solo debería haber una categoría especial
            
            console.log('✅ [CATEGORIES-SERVICE] === CATEGORÍA ESPECIAL ENCONTRADA ===');
            console.log('✅ [CATEGORIES-SERVICE] Categoría completa:', specialCategory);
            console.log('✅ [CATEGORIES-SERVICE] Campos importantes:', {
              _id: specialCategory._id,
              nombre: specialCategory.nombre,
              slug: specialCategory.slug,
              urlSlug: specialCategory.urlSlug,
              configuracionEspecial: specialCategory.configuracionEspecial,
              publicado: specialCategory.publicado,
              metaTitulo: specialCategory.metaTitulo,
              metaDescripcion: specialCategory.metaDescripcion,
              palabrasClave: specialCategory.palabrasClave,
              ogTitulo: specialCategory.ogTitulo,
              ogDescripcion: specialCategory.ogDescripcion,
              ogImagen: specialCategory.ogImagen
            });
            
            // Verificar que el slug existe
            if (!specialCategory.slug) {
              console.error('❌ [CATEGORIES-SERVICE] SLUG FALTANTE en categoría especial!');
              console.error('❌ [CATEGORIES-SERVICE] Todos los campos:', Object.keys(specialCategory));
            }
            
            return specialCategory;
          } else {
            console.warn('⚠️ [CATEGORIES-SERVICE] No se encontró categoría especial');
            console.warn('⚠️ [CATEGORIES-SERVICE] Verificar que existe una categoría con configuracionEspecial=true y publicado=true');
            return null;
          }
        }),
        catchError(error => {
          console.error('❌ [CATEGORIES-SERVICE] Error obteniendo categoría especial:', error);
          console.error('❌ [CATEGORIES-SERVICE] URL:', this.apiUrl);
          console.error('❌ [CATEGORIES-SERVICE] Params:', params);
          return of(null);
        })
      );
  }

  /**
   * Obtener el título del menú para una categoría
   */
  getCategoryMenuTitle(category: FrontCategory): string {
    // Usar metaTitulo si existe, sino usar el nombre de la categoría
    return category.metaTitulo || `Catálogo de ${category.nombre}`;
  }

  /**
   * Obtener la URL de la categoría
   */
  getCategoryUrl(category: FrontCategory): string {
    // Generar URL usando el slug de la categoría
    return `/productos/${category.slug || category.nombre.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Genera un slug desde el nombre de la categoría
   */
  private generateSlug(nombre: string): string {
    return nombre
      .toLowerCase()
      .trim()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Obtener categoría por orden específico
   */
  getCategoryByOrder(orden: number): Observable<FrontCategory | null> {
    console.log(`🔍 [CATEGORIES-SERVICE] Buscando categoría con orden: ${orden}`);
    
    const params = {
      publicado: 'true',
      orden: orden.toString(),
      limit: '1'
    };
    
    return this.http.get<any>(this.apiUrl, { params })
      .pipe(
        map(response => {
          console.log(`🔍 [CATEGORIES-SERVICE] Respuesta para orden ${orden}:`, response);
          const categories = response.categories || response;
          
          if (Array.isArray(categories) && categories.length > 0) {
            const category = categories[0];
            console.log(`✅ [CATEGORIES-SERVICE] Categoría encontrada para orden ${orden}:`, category);
            return category;
          } else {
            console.warn(`⚠️ [CATEGORIES-SERVICE] No se encontró categoría con orden ${orden}`);
            return null;
          }
        }),
        catchError(error => {
          console.error(`❌ [CATEGORIES-SERVICE] Error obteniendo categoría con orden ${orden}:`, error);
          return of(null);
        })
      );
  }

  /**
   * Categorías por defecto como fallback
   */
  getDefaultCategories(): FrontCategory[] {
    return [
      {
        _id: 'default-1',
        nombre: 'Novedades',
        slug: 'novedades',
        publicado: true,
        orden: 1,
        metaTitulo: 'Catálogo de Novedades',
        metaDescripcion: 'Descubre nuestros productos más recientes y novedades exclusivas',
        configuracionEspecial: true
      },
      {
        _id: 'default-2',
        nombre: 'Chocolates',
        slug: 'chocolates',
        publicado: true,
        orden: 2,
        metaTitulo: 'Catálogo de Chocolates',
        metaDescripcion: 'Deliciosos chocolates artesanales de la mejor calidad'
      },
      {
        _id: 'default-3',
        nombre: 'Caramelos',
        slug: 'caramelos',
        publicado: true,
        orden: 3,
        metaTitulo: 'Catálogo de Caramelos',
        metaDescripcion: 'Caramelos artesanales con sabores únicos y tradicionales'
      }
    ];
  }
}
