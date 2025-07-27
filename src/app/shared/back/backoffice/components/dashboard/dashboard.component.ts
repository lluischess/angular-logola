import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BackofficeLayoutComponent } from '../backoffice-layout/backoffice-layout.component';

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
  // Estadísticas simuladas
  stats = {
    totalProductos: 0,
    totalPresupuestos: 0,
    totalCategorias: 0,
    presupuestosAprobados: 0
  };

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Cargar estadísticas simuladas
    this.loadStats();
  }



  /**
   * Cargar estadísticas simuladas
   */
  private loadStats(): void {
    // Simular carga de datos con un pequeño delay
    setTimeout(() => {
      this.stats = {
        totalProductos: 156,
        totalPresupuestos: 23,
        totalCategorias: 8,
        presupuestosAprobados: 18
      };
    }, 800);
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
