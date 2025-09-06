import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface Product {
  _id?: string;
  nombre: string;
  descripcion?: string;
  referencia: string;
  categoria: string;
  cantidadMinima: number;
  precio?: number;
  imagen?: string;
  imagenes?: string[];
  medidas?: string;
  peso?: number;
  orden: number;
  publicado: boolean;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
  // Campos SEO
  metaTitulo?: string;
  metaDescripcion?: string;
  palabrasClave?: string;
  urlSlug?: string;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoria?: string;
  publicado?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  cantidadMinimaMin?: number;
  cantidadMinimaMax?: number;
}

export interface ProductResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductStats {
  total: number;
  publicados: number;
  noPublicados: number;
  porCategoria: { [categoria: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los productos con filtros y paginación
   */
  getProducts(params?: ProductQueryParams): Observable<ProductResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof ProductQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<ProductResponse>(this.apiUrl, { params: httpParams });
  }

  /**
   * Obtener productos publicados (para frontend público)
   */
  getPublishedProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/published`);
  }

  /**
   * Obtener productos por categoría
   */
  getProductsByCategory(categoria: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/category/${categoria}`);
  }

  /**
   * Obtener un producto por ID
   */
  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear un nuevo producto
   */
  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  /**
   * Actualizar un producto
   */
  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}`, product);
  }

  /**
   * Eliminar un producto
   */
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Reordenar productos dentro de una categoría
   */
  reorderProducts(categoria: string, productIds: string[]): Observable<Product[]> {
    return this.http.put<Product[]>(`${this.apiUrl}/reorder/${categoria}`, { productIds });
  }

  /**
   * Actualizar orden de un producto específico
   */
  updateProductOrder(id: string, newOrder: number): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}/order`, { orden: newOrder });
  }

  /**
   * Obtener el siguiente orden disponible para una categoría
   */
  getNextOrderForCategory(categoria: string): Observable<{nextOrder: number}> {
    return this.http.get<{nextOrder: number}>(`${this.apiUrl}/next-order/${categoria}`);
  }

  /**
   * Subir imagen de producto
   */
  uploadProductImage(file: File): Observable<{imagePath: string}> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{imagePath: string}>(`${this.apiUrl}/upload-image`, formData).pipe(
      map((response: {imagePath: string}) => {
        // Procesar URL para reemplazar localhost con environment.apiUrl
        if (response && response.imagePath && response.imagePath.includes('localhost:3000')) {
          response.imagePath = response.imagePath.replace('http://localhost:3000', environment.apiUrl);
        }
        return response;
      })
    );
  }

  /**
   * Eliminar imagen de producto
   */
  deleteProductImage(imagePath: string): Observable<{success: boolean}> {
    return this.http.delete<{success: boolean}>(`${this.apiUrl}/delete-image`, {
      body: { imagePath }
    });
  }

  /**
   * Obtener estadísticas de productos
   */
  getStats(): Observable<ProductStats> {
    return this.http.get<ProductStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Buscar productos
   */
  searchProducts(query: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/search`, {
      params: { q: query }
    });
  }

  /**
   * Generar slug para URL amigable
   */
  generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Obtener categorías únicas de productos
   */
  getUniqueCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }

  /**
   * Obtener próximo orden disponible en una categoría
   */
  getNextOrderInCategory(categoria: string): Observable<{ nextOrder: number }> {
    return this.http.get<{ nextOrder: number }>(`${this.apiUrl}/next-order/${categoria}`);
  }
}
