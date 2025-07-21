import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

/**
 * Componente principal del dashboard del backoffice
 * Incluye menú lateral y pantalla principal con estadísticas
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // Datos del usuario logueado
  currentUser: any = null;
  
  // Estadísticas simuladas
  stats = {
    totalProductos: 0,
    totalPresupuestos: 0,
    totalCategorias: 0,
    ventasHoy: 0,
    pedidosPendientes: 0,
    ingresosMes: 0
  };

  // Estado del menú lateral
  sidebarCollapsed = false;

  // Opciones del menú lateral
  menuItems = [
    {
      icon: '📊',
      label: 'Dashboard',
      route: '/logoadmin/dashboard',
      active: true
    },
    {
      icon: '📋',
      label: 'Presupuestos',
      route: '/logoadmin/presupuestos',
      active: false
    },
    {
      icon: '🍫',
      label: 'Productos',
      route: '/logoadmin/productos',
      active: false
    },
    {
      icon: '📂',
      label: 'Categorías',
      route: '/logoadmin/categorias',
      active: false
    },
    {
      icon: '⚙️',
      label: 'Opciones Generales',
      route: '/logoadmin/configuracion',
      active: false
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Cargar datos del usuario desde localStorage
    this.loadUserData();
    
    // Cargar estadísticas simuladas
    this.loadStats();
  }

  /**
   * Cargar datos del usuario desde localStorage
   */
  private loadUserData(): void {
    const userData = localStorage.getItem('backoffice_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
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
        ventasHoy: 12,
        pedidosPendientes: 5,
        ingresosMes: 15420.50
      };
    }, 800);
  }

  /**
   * Alternar estado del menú lateral
   */
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  /**
   * Navegar a una ruta y actualizar menú activo
   */
  navigateTo(route: string): void {
    // Actualizar estado activo del menú
    this.menuItems.forEach(item => {
      item.active = item.route === route;
    });
    
    // Navegar a la ruta
    this.router.navigate([route]);
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    // Limpiar localStorage
    localStorage.removeItem('backoffice_token');
    localStorage.removeItem('backoffice_user');
    
    // Redirigir al login
    this.router.navigate(['/logoadmin']);
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
}
