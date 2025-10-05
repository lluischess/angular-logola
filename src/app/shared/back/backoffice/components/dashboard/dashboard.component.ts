import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';
import { BackofficeLayoutComponent } from '../backoffice-layout/backoffice-layout.component';
import { BudgetsService } from '../../../services/budgets.service';

/**
 * Componente principal del dashboard del backoffice
 * Incluye menú lateral y pantalla principal con estadísticas
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BackofficeLayoutComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // Estadísticas del dashboard
  stats = {
    totalProductos: 0,
    totalPresupuestos: 0,
    totalCategorias: 0,
    presupuestosEnviados: 0
  };

  // Estado de carga
  isLoadingStats = true;
  statsError = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private budgetsService: BudgetsService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Cargar estadísticas reales del backend
    this.loadRealStats();
  }



  /**
   * Cargar estadísticas reales del backend
   */
  private loadRealStats(): void {
    //console.log('🔄 [DASHBOARD] Cargando estadísticas reales del backend...');
    this.isLoadingStats = true;
    this.statsError = false;

    // Cargar estadísticas de presupuestos
    this.budgetsService.getStats().subscribe({
      next: (budgetStats) => {
        //console.log('✅ [DASHBOARD] Estadísticas de presupuestos obtenidas:', budgetStats);

        // Mapear estadísticas de presupuestos
        this.stats.totalPresupuestos = budgetStats.total || 0;
        this.stats.presupuestosEnviados = budgetStats.byStatus?.['enviado'] || 0;

        // Cargar productos y categorías por separado
        this.loadProductsAndCategories();
      },
      error: (error: any) => {
        console.error('❌ [DASHBOARD] Error cargando estadísticas de presupuestos:', error);
        this.loadStatsIndividually();
      }
    });
  }

  /**
   * Cargar productos y categorías usando endpoints directos
   */
  private loadProductsAndCategories(): void {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Cargar productos - usar el campo 'total' de la respuesta paginada
    this.http.get(`${environment.apiUrl}/products?limit=1`, { headers }).subscribe({
      next: (response: any) => {
        // La API devuelve { products: [], total: X, page: Y, totalPages: Z }
        // Usamos el campo 'total' que contiene el conteo real de todos los productos
        this.stats.totalProductos = response.total || 0;
        //console.log('📦 [DASHBOARD] Total de productos:', this.stats.totalProductos);
      },
      error: (error: any) => {
        console.error('❌ [DASHBOARD] Error cargando productos:', error);
        this.stats.totalProductos = 0;
      }
    });

    // Cargar categorías
    this.http.get(`${environment.apiUrl}/categories`, { headers }).subscribe({
      next: (response: any) => {
        const categories = response.categories || response.data || response;
        this.stats.totalCategorias = Array.isArray(categories) ? categories.length : 0;
        //console.log('📂 [DASHBOARD] Categorías cargadas:', this.stats.totalCategorias);

        // Terminar carga
        this.isLoadingStats = false;
        //console.log('📊 [DASHBOARD] Estadísticas finales:', this.stats);
      },
      error: (error: any) => {
        console.error('❌ [DASHBOARD] Error cargando categorías:', error);
        this.stats.totalCategorias = 0;
        this.isLoadingStats = false;
      }
    });
  }

  /**
   * Cargar estadísticas individualmente como fallback
   */
  private loadStatsIndividually(): void {
    //console.log('🔄 [DASHBOARD] Cargando estadísticas individualmente como fallback...');

    const token = localStorage.getItem('authToken');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Cargar productos - usar el campo 'total' de la respuesta paginada
    this.http.get(`${environment.apiUrl}/products?limit=1`, { headers }).subscribe({
      next: (response: any) => {
        // La API devuelve { products: [], total: X, page: Y, totalPages: Z }
        // Usamos el campo 'total' que contiene el conteo real de todos los productos
        this.stats.totalProductos = response.total || 0;
        //console.log('📦 [DASHBOARD] Total de productos (fallback):', this.stats.totalProductos);
      },
      error: (error: any) => {
        console.error('❌ Error cargando productos (fallback):', error);
        this.stats.totalProductos = 0;
      }
    });

    // Cargar categorías
    this.http.get(`${environment.apiUrl}/categories`, { headers }).subscribe({
      next: (response: any) => {
        const categories = response.categories || response.data || response;
        this.stats.totalCategorias = Array.isArray(categories) ? categories.length : 0;
        //console.log('📂 [DASHBOARD] Categorías cargadas (fallback):', this.stats.totalCategorias);
      },
      error: (error: any) => {
        console.error('❌ Error cargando categorías (fallback):', error);
        this.stats.totalCategorias = 0;
      }
    });

    // Cargar presupuestos
    this.budgetsService.getBudgets({ limit: 100 }).subscribe({
      next: (response: any) => {
        const budgets = response.budgets || response.data || response;
        if (Array.isArray(budgets)) {
          this.stats.totalPresupuestos = budgets.length;
          this.stats.presupuestosEnviados = budgets.filter((b: any) => b.estado === 'enviado').length;
        }
        //console.log('📋 [DASHBOARD] Presupuestos cargados (fallback):', {
        //   total: this.stats.totalPresupuestos,
        //   enviados: this.stats.presupuestosEnviados
        // });
        this.isLoadingStats = false;
      },
      error: (error: any) => {
        console.error('❌ Error cargando presupuestos (fallback):', error);
        this.stats.totalPresupuestos = 0;
        this.stats.presupuestosEnviados = 0;
        this.isLoadingStats = false;
      }
    });
  }

  /**
   * Navegar a una ruta
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Formatear números para mostrar
   */
  formatNumber(num: number): string {
    return num.toLocaleString('es-ES');
  }

  /**
   * Formatear moneda
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  /**
   * Verificar si es dispositivo móvil
   */
  isMobile(): boolean {
    return window.innerWidth <= 768;
  }
}
