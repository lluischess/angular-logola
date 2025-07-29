import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BackofficeLayoutComponent } from '../backoffice-layout/backoffice-layout.component';
import { BudgetsService, Budget, BudgetStatus, BudgetStats } from '../../../services/budgets.service';

// Interfaces para compatibilidad con el template existente
export interface Presupuesto {
  id: string;
  numeroPresupuesto: number;
  numeroPedido: string;
  nombreEmpresa: string;
  nombreContacto: string;
  email: string;
  telefono: string;
  direccion: string;
  fecha: Date;
  estado: string;
  productos: ProductoPresupuesto[];
  logoEmpresa: string;
  aceptaCorreosPublicitarios: boolean;
  cantidadTotal: number;
  precioTotal?: number;
  apuntes?: string;
}

export interface ProductoPresupuesto {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
  imagen: string;
}

@Component({
  selector: 'app-presupuestos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BackofficeLayoutComponent],
  templateUrl: './presupuestos.component.html',
  styleUrl: './presupuestos.component.css'
})
export class PresupuestosComponent implements OnInit {
  presupuestos: Presupuesto[] = [];
  filteredPresupuestos: Presupuesto[] = [];
  stats: BudgetStats | null = null;
  
  // Estados de carga y error
  loading = false;
  error: string | null = null;
  
  // Filtros
  filtroEmpresa: string = '';
  filtroCantidad: string = '';
  filtroTelefono: string = '';
  filtroEmail: string = '';
  filtroEstado: string = '';
  
  // Ordenamiento
  sortColumn: string = 'numeroPresupuesto';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private budgetsService: BudgetsService
  ) {}

  ngOnInit() {
    this.testConnectivity();
    this.loadBudgets();
    this.loadStats();
  }
  
  // Método de prueba para diagnosticar conectividad
  testConnectivity() {
    console.log('🧪 CONNECTIVITY TEST: Starting diagnostic test');
    console.log('🧪 CONNECTIVITY TEST: Token in localStorage:', localStorage.getItem('authToken'));
    console.log('🧪 CONNECTIVITY TEST: API URL:', `http://localhost:3000/budgets`);
    
    // Test directo con fetch para ver qué pasa
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('❌ CONNECTIVITY TEST: No token found! User needs to login first.');
      this.error = 'No hay token de autenticación. Por favor, inicia sesión.';
      return;
    }
    
    fetch('http://localhost:3000/budgets', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('🧪 CONNECTIVITY TEST: Response status:', response.status);
      console.log('🧪 CONNECTIVITY TEST: Response headers:', response.headers);
      return response.json();
    })
    .then(data => {
      console.log('🧪 CONNECTIVITY TEST: Response data:', data);
    })
    .catch(error => {
      console.error('🧪 CONNECTIVITY TEST: Fetch error:', error);
    });
  }

  loadBudgets() {
    this.loading = true;
    this.error = null;
    
    console.log('🔍 DEBUG: Starting loadBudgets method');
    console.log('🔍 DEBUG: Current user token:', localStorage.getItem('authToken'));
    
    const queryParams = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: this.sortColumn,
      sortOrder: this.sortDirection
    };
    
    console.log('🔍 DEBUG: Query params:', queryParams);
    console.log('🔍 DEBUG: API URL will be:', `http://localhost:3000/budgets`);
    
    this.budgetsService.getBudgets(queryParams).subscribe({
      next: (response) => {
        console.log('✅ DEBUG: Budgets loaded successfully!');
        console.log('✅ DEBUG: Raw response from backend:', response);
        console.log('✅ DEBUG: Response type:', typeof response);
        console.log('✅ DEBUG: Response.budgets:', response.budgets);
        console.log('✅ DEBUG: Response.budgets length:', response.budgets?.length);
        
        // Convertir los datos del backend al formato esperado por el template
        if (response.budgets && Array.isArray(response.budgets)) {
          this.presupuestos = response.budgets.map(budget => {
            console.log('🔄 DEBUG: Converting budget:', budget);
            const converted = this.convertBudgetToPresupuesto(budget);
            console.log('🔄 DEBUG: Converted to presupuesto:', converted);
            return converted;
          });
          console.log('✅ DEBUG: Final presupuestos array:', this.presupuestos);
        } else {
          console.warn('⚠️ DEBUG: No budgets array in response or not an array');
          this.presupuestos = [];
        }
        
        this.totalItems = response.total || 0;
        this.totalPages = response.totalPages || 1;
        this.currentPage = response.page || 1;
        
        console.log('🔍 DEBUG: Before applyFilters - presupuestos length:', this.presupuestos.length);
        this.applyFilters();
        console.log('🔍 DEBUG: After applyFilters - filteredPresupuestos length:', this.filteredPresupuestos.length);
        
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ DEBUG: Error loading budgets!');
        console.error('❌ DEBUG: Error object:', error);
        console.error('❌ DEBUG: Error status:', error.status);
        console.error('❌ DEBUG: Error message:', error.message);
        console.error('❌ DEBUG: Error body:', error.error);
        
        this.error = error.message || 'Error al cargar los presupuestos';
        this.loading = false;
        this.presupuestos = [];
        this.filteredPresupuestos = [];
      }
    });
  }
  
  loadStats() {
    this.budgetsService.getStats().subscribe({
      next: (stats) => {
        console.log('Budget stats loaded:', stats);
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading budget stats:', error);
        // No mostrar error para stats, es información secundaria
      }
    });
  }
  
  convertBudgetToPresupuesto(budget: Budget): Presupuesto {
    return {
      id: (budget as any)._id || '',
      numeroPresupuesto: (budget as any).numeroPresupuesto || 0,
      numeroPedido: budget.numeroPedido,
      nombreEmpresa: budget.cliente.empresa || 'Sin empresa',
      nombreContacto: budget.cliente.nombre,
      email: budget.cliente.email,
      telefono: budget.cliente.telefono || 'Sin teléfono',
      direccion: budget.cliente.direccion || 'Sin dirección',
      fecha: budget.createdAt ? new Date(budget.createdAt) : new Date(),
      estado: this.mapBudgetStatus(budget.estado),
      productos: budget.productos.map(p => ({
        id: p.productId,
        nombre: p.nombre,
        categoria: 'Sin categoría', // El backend no devuelve categoría en productos
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario || 0,
        precioTotal: p.subtotal || (p.precioUnitario || 0) * p.cantidad,
        imagen: '/assets/images/producto-default.jpg'
      })),
      logoEmpresa: budget.logotipoEmpresa || '/assets/images/logo-default.jpg',
      aceptaCorreosPublicitarios: budget.aceptaCorreosPublicitarios,
      cantidadTotal: budget.productos.reduce((total, p) => total + p.cantidad, 0),
      precioTotal: budget.precioTotal,
      apuntes: budget.notas
    };
  }
  
  mapBudgetStatus(status: BudgetStatus): string {
    const statusMap: { [key in BudgetStatus]: string } = {
      [BudgetStatus.PENDIENTE]: 'pendiente',
      [BudgetStatus.EN_PROCESO]: 'en_proceso',
      [BudgetStatus.ENVIADO]: 'enviado',
      [BudgetStatus.ACEPTADO]: 'aprobado',
      [BudgetStatus.RECHAZADO]: 'rechazado',
      [BudgetStatus.VENCIDO]: 'vencido'
    };
    return statusMap[status] || 'pendiente';
  }

  applyFilters() {
    this.filteredPresupuestos = this.presupuestos.filter(presupuesto => {
      return (!this.filtroEmpresa || presupuesto.nombreEmpresa.toLowerCase().includes(this.filtroEmpresa.toLowerCase())) &&
             (!this.filtroCantidad || presupuesto.cantidadTotal.toString().includes(this.filtroCantidad)) &&
             (!this.filtroTelefono || presupuesto.telefono.toLowerCase().includes(this.filtroTelefono.toLowerCase())) &&
             (!this.filtroEmail || presupuesto.email.toLowerCase().includes(this.filtroEmail.toLowerCase())) &&
             (!this.filtroEstado || presupuesto.estado === this.filtroEstado);
    });
    this.sortFilteredData();
  }

  clearFilters() {
    this.filtroEmpresa = '';
    this.filtroCantidad = '';
    this.filtroTelefono = '';
    this.filtroEmail = '';
    this.filtroEstado = '';
    this.applyFilters();
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    // Recargar datos con nuevo ordenamiento desde el backend
    this.loadBudgets();
  }

  private sortData() {
    this.presupuestos.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'numeroPresupuesto':
          aValue = a.numeroPresupuesto;
          bValue = b.numeroPresupuesto;
          break;
        case 'id':
        case 'numeroPedido':
          aValue = a.numeroPedido.toLowerCase();
          bValue = b.numeroPedido.toLowerCase();
          break;
        case 'nombreEmpresa':
          aValue = a.nombreEmpresa.toLowerCase();
          bValue = b.nombreEmpresa.toLowerCase();
          break;
        case 'cantidadTotal':
          aValue = a.cantidadTotal;
          bValue = b.cantidadTotal;
          break;
        case 'telefono':
          aValue = a.telefono.toLowerCase();
          bValue = b.telefono.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'fecha':
          aValue = a.fecha.getTime();
          bValue = b.fecha.getTime();
          break;
        case 'estado':
          aValue = a.estado.toLowerCase();
          bValue = b.estado.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  private sortFilteredData() {
    this.filteredPresupuestos.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'numeroPresupuesto':
          aValue = a.numeroPresupuesto;
          bValue = b.numeroPresupuesto;
          break;
        case 'id':
        case 'numeroPedido':
          aValue = a.numeroPedido.toLowerCase();
          bValue = b.numeroPedido.toLowerCase();
          break;
        case 'nombreEmpresa':
          aValue = a.nombreEmpresa.toLowerCase();
          bValue = b.nombreEmpresa.toLowerCase();
          break;
        case 'cantidadTotal':
          aValue = a.cantidadTotal;
          bValue = b.cantidadTotal;
          break;
        case 'telefono':
          aValue = a.telefono.toLowerCase();
          bValue = b.telefono.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'fecha':
          aValue = a.fecha.getTime();
          bValue = b.fecha.getTime();
          break;
        case 'estado':
          aValue = a.estado.toLowerCase();
          bValue = b.estado.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return '↕️';
    }
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'aprobado': return 'estado-aprobado';
      case 'rechazado': return 'estado-rechazado';
      case 'pendiente': return 'estado-pendiente';
      default: return '';
    }
  }

  viewPresupuesto(id: string) {
    console.log('Ver presupuesto:', id);
    // Navegar a la ficha de detalle del presupuesto
    this.router.navigate(['/logoadmin/presupuestos', id]);
  }

  editPresupuesto(id: string) {
    console.log('Editar presupuesto:', id);
    // Aquí implementarías la lógica para editar el presupuesto
  }

  trackByFn(index: number, item: Presupuesto): string {
    return item.id;
  }
  
  // Métodos auxiliares para el template
  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'en_proceso': 'En Proceso',
      'enviado': 'Enviado',
      'aprobado': 'Aprobado',
      'rechazado': 'Rechazado',
      'vencido': 'Vencido'
    };
    return labels[estado] || estado;
  }
  
  formatCurrency(amount: number | undefined): string {
    if (!amount) return '0,00 €';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
  
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }
  
  // Método loadUserData eliminado - el layout reutilizable maneja la información del usuario
  
  // Métodos de navegación y sidebar eliminados - el layout reutilizable maneja todo esto
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/logoadmin/login']);
  }
}
