import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface Category {
  _id?: string;
  nombre: string;
  descripcion?: string;
  orden: number;
  publicado?: boolean;
  configuracionEspecial?: boolean;
  // Campos SEO
  metaTitulo?: string;
  metaDescripcion?: string;
  palabrasClave?: string;
  urlSlug?: string;
  // Campos adicionales del backend
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
  productCount?: number;
}

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  publicado?: boolean;
  configuracionEspecial?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryResponse {
  data: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CategoryStats {
  total: number;
  publicadas: number;
  noPublicadas: number;
  configuracionEspecial: number;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las categorías con filtros y paginación
   */
  getCategories(params?: CategoryQueryParams): Observable<CategoryResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof CategoryQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<CategoryResponse>(this.apiUrl, { params: httpParams });
  }

  /**
   * Obtener categorías publicadas (para frontend público)
   */
  getPublishedCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/published`);
  }

  /**
   * Obtener categorías de novedades
   */
  getNovedadesCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/novedades`);
  }

  /**
   * Obtener estadísticas de categorías
   */
  getStats(): Observable<CategoryStats> {
    return this.http.get<CategoryStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Obtener una categoría por ID
   */
  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener una categoría por slug
   */
  getCategoryBySlug(slug: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/slug/${slug}`);
  }

  /**
   * Crear una nueva categoría
   */
  createCategory(category: Omit<Category, '_id' | 'fechaCreacion' | 'fechaActualizacion' | 'productCount'>): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category);
  }

  /**
   * Actualizar una categoría existente
   */
  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    return this.http.patch<Category>(`${this.apiUrl}/${id}`, category);
  }

  /**
   * Eliminar una categoría
   */
  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Reordenar categorías
   */
  reorderCategories(reorderData: { categoryId: string; newOrder: number }[]): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/reorder`, { categories: reorderData });
  }

  /**
   * Generar slug a partir del nombre
   */
  generateSlug(nombre: string): string {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}
