import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface BudgetProduct {
  productoId: string;  // Referencia al producto real
  cantidad: number;
  precioUnitario: number;
  
  // Datos enriquecidos del producto (obtenidos por JOIN)
  producto?: {
    _id: string;
    nombre: string;
    referencia: string;
    imagen?: string;
    categoria: {
      _id: string;
      nombre: string;
      color?: string;
    };
    precio: number;  // Precio actual del producto
    publicado: boolean;
  };
  
  // Campos calculados
  subtotal?: number;
}

export interface ClientData {
  email: string;
  nombre: string;
  telefono?: string;
  direccion?: string;
  empresa?: string;
  detalles?: string;
}

export enum BudgetStatus {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  ENVIADO = 'ENVIADO',
  ACEPTADO = 'ACEPTADO',
  RECHAZADO = 'RECHAZADO',
  VENCIDO = 'VENCIDO'
}

export interface StatusHistory {
  estado: BudgetStatus;
  fecha: Date;
  notas?: string;
  usuarioId?: string;
}

export interface EmailNotification {
  enviado: boolean;
  fechaEnvio?: Date;
  error?: string;
}

export interface Budget {
  _id?: string;
  numeroPresupuesto?: number;  // Campo autonumérico
  numeroPedido: string;
  cliente: ClientData;
  productos: BudgetProduct[];
  estado: BudgetStatus;
  historialEstados: StatusHistory[];
  logotipoEmpresa?: string;
  aceptaCorreosPublicitarios: boolean;
  notas?: string;
  notasInternas?: string;
  precioTotal?: number;
  fechaVencimiento?: Date;
  notificacionesEmail: {
    cliente: EmailNotification;
    admin: EmailNotification;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BudgetQueryParams {
  page?: number;
  limit?: number;
  estado?: BudgetStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface BudgetStats {
  total: number;
  byStatus: {
    [key: string]: number;
  };
  vencidos: number;
  sinNotificarAdmin: number;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetsService {
  private apiUrl = `${environment.apiUrl}/budgets`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('BudgetsService Error:', error);
    let errorMessage = 'Error desconocido';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 0) {
      errorMessage = 'No se puede conectar con el servidor';
    } else if (error.status === 401) {
      errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente';
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos para realizar esta acción';
    } else if (error.status === 404) {
      errorMessage = 'Presupuesto no encontrado';
    } else if (error.status >= 500) {
      errorMessage = 'Error interno del servidor';
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Obtener todos los presupuestos con filtros
  getBudgets(params?: BudgetQueryParams): Observable<{ budgets: Budget[], total: number, page: number, totalPages: number }> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.estado) httpParams = httpParams.set('estado', params.estado);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
      if (params.fechaDesde) httpParams = httpParams.set('fechaDesde', params.fechaDesde);
      if (params.fechaHasta) httpParams = httpParams.set('fechaHasta', params.fechaHasta);
    }

    return this.http.get<any>(`${this.apiUrl}`, { 
      headers: this.getAuthHeaders(),
      params: httpParams 
    }).pipe(
      map(response => {
        console.log('BudgetsService - Raw response:', response);
        
        // Parseo adaptativo de la respuesta del backend
        if (response.budgets) {
          return response;
        } else if (response.data) {
          return {
            budgets: response.data,
            total: response.total || response.data.length,
            page: response.page || 1,
            totalPages: response.totalPages || 1
          };
        } else if (Array.isArray(response)) {
          return {
            budgets: response,
            total: response.length,
            page: 1,
            totalPages: 1
          };
        } else {
          console.warn('Formato de respuesta inesperado:', response);
          return {
            budgets: [],
            total: 0,
            page: 1,
            totalPages: 1
          };
        }
      }),
      catchError(this.handleError)
    );
  }

  // Obtener estadísticas de presupuestos
  getStats(): Observable<BudgetStats> {
    return this.http.get<BudgetStats>(`${this.apiUrl}/stats`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener presupuestos pendientes
  getPendingBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${this.apiUrl}/pending`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener presupuestos vencidos
  getExpiredBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${this.apiUrl}/expired`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener un presupuesto por ID
  getBudget(id: string): Observable<Budget> {
    return this.http.get<Budget>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener un presupuesto ENRIQUECIDO por ID (con datos reales de productos)
  getBudgetEnriched(id: string): Observable<Budget> {
    return this.http.get<Budget>(`${this.apiUrl}/${id}/enriched`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener presupuesto por número de pedido (endpoint público)
  getBudgetByOrderNumber(numeroPedido: string): Observable<Budget> {
    return this.http.get<Budget>(`${this.apiUrl}/order/${numeroPedido}`).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener presupuesto ENRIQUECIDO por número de presupuesto
  getBudgetByNumberEnriched(numeroPresupuesto: number): Observable<Budget> {
    return this.http.get<Budget>(`${this.apiUrl}/numero/${numeroPresupuesto}/enriched`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar presupuesto
  updateBudget(id: string, updateData: Partial<Budget>): Observable<Budget> {
    return this.http.patch<Budget>(`${this.apiUrl}/${id}`, updateData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar estado del presupuesto
  updateBudgetStatus(id: string, estado: BudgetStatus, notas?: string): Observable<Budget> {
    const updateData: any = { estado };
    if (notas) {
      updateData.notasEstado = notas;
    }
    
    return this.updateBudget(id, updateData);
  }

  // Eliminar presupuesto
  deleteBudget(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Reenviar emails fallidos
  resendFailedEmails(): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-emails`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Métodos auxiliares para el frontend
  getStatusLabel(status: BudgetStatus): string {
    const labels: { [key in BudgetStatus]: string } = {
      [BudgetStatus.PENDIENTE]: 'Pendiente',
      [BudgetStatus.EN_PROCESO]: 'En Proceso',
      [BudgetStatus.ENVIADO]: 'Enviado',
      [BudgetStatus.ACEPTADO]: 'Aceptado',
      [BudgetStatus.RECHAZADO]: 'Rechazado',
      [BudgetStatus.VENCIDO]: 'Vencido'
    };
    return labels[status] || status;
  }

  getStatusClass(status: BudgetStatus): string {
    const classes: { [key in BudgetStatus]: string } = {
      [BudgetStatus.PENDIENTE]: 'badge-warning',
      [BudgetStatus.EN_PROCESO]: 'badge-info',
      [BudgetStatus.ENVIADO]: 'badge-primary',
      [BudgetStatus.ACEPTADO]: 'badge-success',
      [BudgetStatus.RECHAZADO]: 'badge-danger',
      [BudgetStatus.VENCIDO]: 'badge-secondary'
    };
    return classes[status] || 'badge-secondary';
  }

  calculateBudgetTotal(productos: BudgetProduct[]): number {
    return productos.reduce((total, producto) => {
      const subtotal = producto.subtotal || (producto.precioUnitario * producto.cantidad);
      return total + subtotal;
    }, 0);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
}
