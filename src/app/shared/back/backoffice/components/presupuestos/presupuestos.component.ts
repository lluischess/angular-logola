import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';

export interface Presupuesto {
  id: number;
  nombreEmpresa: string;
  cantidadTotal: number;
  telefono: string;
  email: string;
  fecha: Date;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
}

@Component({
  selector: 'app-presupuestos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './presupuestos.component.html',
  styleUrl: './presupuestos.component.css'
})
export class PresupuestosComponent implements OnInit {
  presupuestos: Presupuesto[] = [];
  filteredPresupuestos: Presupuesto[] = [];
  
  // Filtros
  filtroId: string = '';
  filtroEmpresa: string = '';
  filtroCantidad: string = '';
  filtroTelefono: string = '';
  filtroEmail: string = '';
  
  // Ordenamiento
  sortColumn: string = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Sidebar
  sidebarCollapsed = false;
  currentUser: any = null;
  
  // Opciones del menú lateral
  menuItems = [
    {
      icon: '📊',
      label: 'Dashboard',
      route: '/logoadmin/dashboard',
      active: false
    },
    {
      icon: '📋',
      label: 'Presupuestos',
      route: '/logoadmin/presupuestos',
      active: true
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

  constructor(
    private router: Router,
    private authService: AuthService,
    public sidebarService: SidebarService
  ) {}

  ngOnInit() {
    this.loadMockData();
    this.sortData();
    this.filteredPresupuestos = [...this.presupuestos];
    this.loadUserData();
  }

  loadMockData() {
    this.presupuestos = [
      {
        id: 1001,
        nombreEmpresa: 'Dulces Barcelona S.L.',
        cantidadTotal: 250,
        telefono: '+34 932 123 456',
        email: 'pedidos@dulcesbarcelona.com',
        fecha: new Date('2024-01-15'),
        estado: 'pendiente'
      },
      {
        id: 1002,
        nombreEmpresa: 'Chocolates Madrid',
        cantidadTotal: 180,
        telefono: '+34 915 987 654',
        email: 'info@chocolatesmadrid.es',
        fecha: new Date('2024-01-16'),
        estado: 'aprobado'
      },
      {
        id: 1003,
        nombreEmpresa: 'Caramelos Valencia',
        cantidadTotal: 320,
        telefono: '+34 963 456 789',
        email: 'compras@caramelosvalencia.com',
        fecha: new Date('2024-01-17'),
        estado: 'pendiente'
      },
      {
        id: 1004,
        nombreEmpresa: 'Golosinas Sevilla',
        cantidadTotal: 95,
        telefono: '+34 954 321 987',
        email: 'contacto@golosinassevilla.es',
        fecha: new Date('2024-01-18'),
        estado: 'rechazado'
      },
      {
        id: 1005,
        nombreEmpresa: 'Confitería Bilbao',
        cantidadTotal: 420,
        telefono: '+34 944 567 123',
        email: 'ventas@confiteriabilbao.com',
        fecha: new Date('2024-01-19'),
        estado: 'aprobado'
      },
      {
        id: 1006,
        nombreEmpresa: 'Dulces Artesanos',
        cantidadTotal: 150,
        telefono: '+34 987 654 321',
        email: 'info@dulcesartesanos.es',
        fecha: new Date('2024-01-20'),
        estado: 'pendiente'
      }
    ];
  }

  applyFilters() {
    this.filteredPresupuestos = this.presupuestos.filter(presupuesto => {
      return (
        (this.filtroId === '' || presupuesto.id.toString().includes(this.filtroId)) &&
        (this.filtroEmpresa === '' || presupuesto.nombreEmpresa.toLowerCase().includes(this.filtroEmpresa.toLowerCase())) &&
        (this.filtroCantidad === '' || presupuesto.cantidadTotal.toString().includes(this.filtroCantidad)) &&
        (this.filtroTelefono === '' || presupuesto.telefono.toLowerCase().includes(this.filtroTelefono.toLowerCase())) &&
        (this.filtroEmail === '' || presupuesto.email.toLowerCase().includes(this.filtroEmail.toLowerCase()))
      );
    });
    this.sortFilteredData();
  }

  clearFilters() {
    this.filtroId = '';
    this.filtroEmpresa = '';
    this.filtroCantidad = '';
    this.filtroTelefono = '';
    this.filtroEmail = '';
    this.applyFilters();
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortData();
    this.applyFilters();
  }

  private sortData() {
    this.presupuestos.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
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
        case 'id':
          aValue = a.id;
          bValue = b.id;
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

  viewPresupuesto(id: number) {
    console.log('Ver presupuesto:', id);
    // Aquí implementarías la lógica para ver el detalle del presupuesto
  }

  editPresupuesto(id: number) {
    console.log('Editar presupuesto:', id);
    // Aquí implementarías la lógica para editar el presupuesto
  }

  trackByFn(index: number, item: Presupuesto): number {
    return item.id;
  }
  
  // Sidebar methods
  private loadUserData(): void {
    const userData = localStorage.getItem('backoffice_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    } else {
      // Mock user data if not found
      this.currentUser = {
        username: 'Admin',
        role: 'Administrador'
      };
    }
  }
  
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  
  navigateTo(route: string): void {
    // Actualizar estado activo del menú
    this.menuItems.forEach(item => {
      item.active = item.route === route;
    });
    
    // Auto-ocultar menú en móvil al seleccionar nav-item
    const isMobile = window.innerWidth <= 768;
    if (isMobile && !this.sidebarService.isCollapsed) {
      this.sidebarService.closeSidebar();
      console.log('Auto-ocultando menú en móvil al seleccionar nav-item - ancho:', window.innerWidth);
    }
    
    // Navegar a la ruta
    this.router.navigate([route]);
  }
  
  logout(): void {
    // Limpiar localStorage
    localStorage.removeItem('backoffice_token');
    localStorage.removeItem('backoffice_user');
    
    // Redirigir al login
    this.router.navigate(['/logoadmin']);
  }
}
