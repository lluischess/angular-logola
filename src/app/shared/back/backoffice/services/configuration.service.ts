import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface ConfigurationData {
  seo: {
    homeTitle: string;
    homeDescription: string;
    homeKeywords: string;
    siteName: string;
    defaultImage: string;
  };
  footer: {
    contactoTelefono: string;
    contactoEmail: string;
    contactoDireccion: string;
    horarioAtencion: string;
    queEsLogolate: string;
    redesSociales: {
      instagram: string;
    };
  };
  general: {
    logoHeader: string;
    logoFooter: string;
    favicon: string;
  };
  banner: {
    banners: Array<{
      id: number;
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
    }>;
  };
}

export interface ImageUploadResponse {
  success: boolean;
  filename: string;
  url: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private apiUrl = `${environment.apiUrl}/configuration`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener toda la configuración pública (para frontend)
   */
  getConfiguration(): Observable<ConfigurationData> {
    return this.http.get<ConfigurationData>(`${this.apiUrl}/public`);
  }

  /**
   * Obtener configuración por sección
   */
  getConfigurationSection(section: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${section}`);
  }

  /**
   * Actualizar configuración por sección
   */
  updateConfigurationSection(section: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${section}`, data);
  }

  /**
   * Subir imagen al servidor
   */
  uploadImage(file: File, category: string): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'configuration');

    return this.http.post<any>(`${environment.apiUrl}/upload/configuration`, formData).pipe(
      map(response => {
        // El nuevo endpoint devuelve {success: true, imageUrl: string}
        if (response && response.success && response.imageUrl) {
          return {
            datos: {
              ruta: response.imageUrl,
              filename: response.imageUrl.split('/').pop()
            }
          };
        }
        // Fallback para el formato anterior
        if (response && response.datos) {
          let processedUrl = response.datos.ruta;
          if (processedUrl && processedUrl.includes('localhost:3000')) {
            processedUrl = processedUrl.replace('http://localhost:3000', environment.apiUrl);
          }
          
          return {
            success: true,
            url: processedUrl,
            filename: response.datos.nombreOriginal || response.datos.nombre,
            message: 'Imagen subida correctamente'
          };
        }
        return {
          success: false,
          message: 'Error al procesar la respuesta del servidor'
        };
      }),
      catchError((error: any) => {
        console.error('Error al subir imagen:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'Error al subir la imagen',
          error: error
        }));
      })
    );
  }

  /**
   * Eliminar imagen del servidor
   */
  deleteImage(filename: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/images/${filename}`);
  }

  /**
   * Obtener lista de imágenes disponibles
   */
  getAvailableImages(category?: string): Observable<{ images: string[] }> {
    const params: any = {};
    if (category) {
      params.category = category;
    }
    return this.http.get<{ images: string[] }>(`${this.apiUrl}/images`, { params });
  }
}
