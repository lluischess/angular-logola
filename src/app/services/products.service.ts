import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interfaz para los productos del FrontOffice
export interface FrontProduct {
  _id: string;
  numeroProducto?: number;
  referencia: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  urlSlug?: string;
  medidas?: string;
  material?: string;
  ingredientes?: string;
  detalles?: string;
  masDetalles?: string;
  consumePreferente?: string;
  cantidadMinima?: number;
  imagenes?: string[];
  publicado: boolean;
  orden?: number;
  ordenCategoria?: number;
  fechaCreacion?: string;
  // Campos SEO desde la BD (coinciden con el esquema del backend)
  metaTitulo?: string;
  metaDescripcion?: string;
  palabrasClave?: string;
  ogTitulo?: string;
  ogDescripcion?: string;
  ogImagen?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = `${environment.apiUrl}/products`;
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Obtener un producto específico por ID
   */
  getProductById(productId: string): Observable<FrontProduct> {
    //console.log(`🔍 [PRODUCTS-SERVICE] === CARGANDO PRODUCTO POR ID ===`);
    //console.log(`🔍 [PRODUCTS-SERVICE] ID solicitado: ${productId}`);
    //console.log(`🔍 [PRODUCTS-SERVICE] URL completa: ${this.apiUrl}/${productId}`);

    return this.http.get<any>(`${this.apiUrl}/${productId}`)
      .pipe(
        map(response => {
          //console.log(`🔍 [PRODUCTS-SERVICE] === RESPUESTA PRODUCTO INDIVIDUAL ===`);
          //console.log(`🔍 [PRODUCTS-SERVICE] Tipo de respuesta:`, typeof response);
          //console.log(`🔍 [PRODUCTS-SERVICE] Respuesta completa:`, response);

          // El endpoint /{id} devuelve directamente el producto
          if (response && response._id) {
            //console.log(`📦 [PRODUCTS-SERVICE] === PRODUCTO PROCESADO ===`);
            //console.log(`📦 [PRODUCTS-SERVICE] Nombre: ${response.nombre}`);
            //console.log(`📦 [PRODUCTS-SERVICE] ID: ${response._id}`);
            return response;
          } else {
            console.warn(`⚠️ [PRODUCTS-SERVICE] === PRODUCTO NO ENCONTRADO ===`);
            console.warn(`⚠️ [PRODUCTS-SERVICE] Respuesta:`, response);
            throw new Error('Producto no encontrado');
          }
        }),
        catchError(error => {
          console.error(`❌ [PRODUCTS-SERVICE] === ERROR CARGANDO PRODUCTO ===`);
          console.error(`❌ [PRODUCTS-SERVICE] URL: ${this.apiUrl}/${productId}`);
          console.error(`❌ [PRODUCTS-SERVICE] Status:`, error.status);
          console.error(`❌ [PRODUCTS-SERVICE] Status Text:`, error.statusText);
          console.error(`❌ [PRODUCTS-SERVICE] Error completo:`, error);

          // Re-lanzar el error para que el componente lo maneje
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener un producto específico por URL Slug (SEO-friendly)
   * Incluye productos despublicados para mostrar mensaje informativo
   */
  getProductBySlug(productSlug: string): Observable<FrontProduct> {
    //console.log(`🔍 [PRODUCTS-SERVICE] === CARGANDO PRODUCTO POR SLUG ===`);
    //console.log(`🔍 [PRODUCTS-SERVICE] Slug solicitado: ${productSlug}`);
    //console.log(`🔍 [PRODUCTS-SERVICE] URL completa: ${this.apiUrl}/slug/${productSlug}`);

    return this.http.get<any>(`${this.apiUrl}/slug/${productSlug}`)
      .pipe(
        map(response => {
          //console.log(`🔍 [PRODUCTS-SERVICE] === RESPUESTA PRODUCTO POR SLUG ===`);
          //console.log(`🔍 [PRODUCTS-SERVICE] Tipo de respuesta:`, typeof response);
          //console.log(`🔍 [PRODUCTS-SERVICE] Respuesta completa:`, response);

          // El endpoint /slug/{slug} devuelve directamente el producto
          if (response && response._id) {
            //console.log(`📦 [PRODUCTS-SERVICE] === PRODUCTO PROCESADO POR SLUG ===`);
            //console.log(`📦 [PRODUCTS-SERVICE] Nombre: ${response.nombre}`);
            //console.log(`📦 [PRODUCTS-SERVICE] Slug: ${response.urlSlug}`);
            //console.log(`📦 [PRODUCTS-SERVICE] Publicado: ${response.publicado}`);
            //console.log(`📦 [PRODUCTS-SERVICE] ID: ${response._id}`);

            // Devolver el producto independientemente de si está publicado o no
            // El componente manejará la lógica de visualización
            return response;
          } else {
            console.warn(`⚠️ [PRODUCTS-SERVICE] === PRODUCTO NO ENCONTRADO POR SLUG ===`);
            console.warn(`⚠️ [PRODUCTS-SERVICE] Respuesta:`, response);
            throw new Error('Producto no encontrado');
          }
        }),
        catchError(error => {
          console.error(`❌ [PRODUCTS-SERVICE] === ERROR CARGANDO PRODUCTO POR SLUG ===`);
          console.error(`❌ [PRODUCTS-SERVICE] URL: ${this.apiUrl}/slug/${productSlug}`);
          console.error(`❌ [PRODUCTS-SERVICE] Status:`, error.status);
          console.error(`❌ [PRODUCTS-SERVICE] Status Text:`, error.statusText);
          console.error(`❌ [PRODUCTS-SERVICE] Error completo:`, error);

          // Re-lanzar el error para que el componente lo maneje
          return throwError(() => error);
        })
      );
  }

  /**
   * Buscar productos por término de búsqueda (nombre, referencia o categoría)
   */
  searchProducts(searchTerm: string): Observable<FrontProduct[]> {
    //console.log(`🔍 [PRODUCTS-SERVICE] === BUSCANDO PRODUCTOS ===`);
    //console.log(`🔍 [PRODUCTS-SERVICE] Término de búsqueda: ${searchTerm}`);
    //console.log(`🔍 [PRODUCTS-SERVICE] URL completa: ${this.apiUrl}/search?q=${encodeURIComponent(searchTerm)}`);

    return this.http.get<any>(`${this.apiUrl}/search?q=${encodeURIComponent(searchTerm)}`)
      .pipe(
        map(response => {
          //console.log(`🔍 [PRODUCTS-SERVICE] === RESPUESTA BÚSQUEDA ===`);
          //console.log(`🔍 [PRODUCTS-SERVICE] Tipo de respuesta:`, typeof response);
          //console.log(`🔍 [PRODUCTS-SERVICE] Respuesta completa:`, response);

          // El endpoint de búsqueda puede devolver un array directamente o un objeto con productos
          let products: FrontProduct[] = [];

          if (Array.isArray(response)) {
            products = response;
          } else if (response && Array.isArray(response.products)) {
            products = response.products;
          } else if (response && Array.isArray(response.data)) {
            products = response.data;
          }

          //console.log(`📦 [PRODUCTS-SERVICE] === PRODUCTOS DE BÚSQUEDA PROCESADOS ===`);
          //console.log(`📦 [PRODUCTS-SERVICE] Cantidad de productos encontrados:`, products.length);
          //console.log(`📦 [PRODUCTS-SERVICE] Productos:`, products.map(p => ({ nombre: p.nombre, referencia: p.referencia, categoria: p.categoria })));

          return products;
        }),
        catchError(error => {
          console.error(`❌ [PRODUCTS-SERVICE] === ERROR EN BÚSQUEDA ===`);
          console.error(`❌ [PRODUCTS-SERVICE] Término: ${searchTerm}`);
          console.error(`❌ [PRODUCTS-SERVICE] URL: ${this.apiUrl}/search?q=${encodeURIComponent(searchTerm)}`);
          console.error(`❌ [PRODUCTS-SERVICE] Status:`, error.status);
          console.error(`❌ [PRODUCTS-SERVICE] Status Text:`, error.statusText);
          console.error(`❌ [PRODUCTS-SERVICE] Error completo:`, error);

          // En caso de error, devolver array vacío
          return of([]);
        })
      );
  }

  /**
   * Obtener productos de una categoría específica (solo publicados)
   */
  getProductsByCategory(categorySlug: string): Observable<FrontProduct[]> {
    //console.log(`🔍 [PRODUCTS-SERVICE] === INICIANDO LLAMADA AL BACKEND ===`);
    //console.log(`🔍 [PRODUCTS-SERVICE] Categoría solicitada: ${categorySlug}`);
    //console.log(`🔍 [PRODUCTS-SERVICE] URL completa: ${this.apiUrl}/category/${categorySlug}`);
    //console.log(`🔍 [PRODUCTS-SERVICE] Base URL: ${this.apiUrl}`);

    return this.http.get<any>(`${this.apiUrl}/category/${categorySlug}`)
      .pipe(
        map(response => {
          //console.log(`🔍 [PRODUCTS-SERVICE] === RESPUESTA RECIBIDA ===`);
          //console.log(`🔍 [PRODUCTS-SERVICE] Tipo de respuesta:`, typeof response);
          //console.log(`🔍 [PRODUCTS-SERVICE] Es array:`, Array.isArray(response));
          //console.log(`🔍 [PRODUCTS-SERVICE] Respuesta completa:`, response);

          // El endpoint /category/{slug} devuelve directamente un array de productos ya filtrados
          if (Array.isArray(response)) {
            //console.log(`📦 [PRODUCTS-SERVICE] === PRODUCTOS PROCESADOS ===`);
            //console.log(`📦 [PRODUCTS-SERVICE] Cantidad: ${response.length}`);
            //console.log(`📦 [PRODUCTS-SERVICE] Primer producto:`, response[0]);
            return response;
          } else {
            console.warn(`⚠️ [PRODUCTS-SERVICE] === RESPUESTA NO ES ARRAY ===`);
            console.warn(`⚠️ [PRODUCTS-SERVICE] Tipo recibido:`, typeof response);
            console.warn(`⚠️ [PRODUCTS-SERVICE] Contenido:`, response);
            return [];
          }
        }),
        catchError(error => {
          console.error(`❌ [PRODUCTS-SERVICE] === ERROR EN LLAMADA HTTP ===`);
          console.error(`❌ [PRODUCTS-SERVICE] URL: ${this.apiUrl}/category/${categorySlug}`);
          console.error(`❌ [PRODUCTS-SERVICE] Status:`, error.status);
          console.error(`❌ [PRODUCTS-SERVICE] Status Text:`, error.statusText);
          console.error(`❌ [PRODUCTS-SERVICE] Error completo:`, error);
          console.error(`❌ [PRODUCTS-SERVICE] Message:`, error.message);

          // Fallback: devolver array vacío
          return of([]);
        })
      );
  }

  /**
   * Obtener todos los productos publicados
   */
  getAllPublishedProducts(): Observable<FrontProduct[]> {
    //console.log('📦 [PRODUCTS-SERVICE] Cargando todos los productos publicados');

    return this.http.get<any>(`${this.apiUrl}?publicado=true`)
      .pipe(
        map(response => {
          //console.log('📦 [PRODUCTS-SERVICE] Respuesta cruda del backend:', response);

          // Extraer los productos de la respuesta {products: [...]}
          const products = response.products || response;

          if (Array.isArray(products)) {
            // Filtrar solo productos publicados y ordenar
            const publishedProducts = products
              .filter(product => product.publicado === true)
              .sort((a, b) => (a.ordenCategoria || 0) - (b.ordenCategoria || 0));

            //console.log('📦 [PRODUCTS-SERVICE] Productos publicados procesados:', publishedProducts);
            return publishedProducts;
          } else {
            console.warn('⚠️ [PRODUCTS-SERVICE] Respuesta no es un array:', products);
            return [];
          }
        }),
        catchError(error => {
          console.error('❌ [PRODUCTS-SERVICE] Error cargando todos los productos:', error);

          // Fallback: devolver array vacío
          return of([]);
        })
      );
  }



  /**
   * Obtener URL absoluta para imagen
   */
  getAbsoluteImageUrl(imagePath: string): string {
    if (!imagePath) {
      return this.getPlaceholderImage();
    }

    // Si ya es una URL absoluta (http/https), devolverla tal como está
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Si es una ruta relativa que empieza con /, construir URL absoluta
    if (imagePath.startsWith('/')) {
      return `${this.baseUrl}${imagePath}`;
    }

    // Si es una ruta relativa sin /, añadir el prefijo completo
    return `${this.baseUrl}/uploads/productos/${imagePath}`;
  }

  /**
   * Obtener imagen placeholder si no hay imagen
   */
  getPlaceholderImage(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K';
  }
}
