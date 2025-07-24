import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';

export interface Presupuesto {
  id: number;
  nombreEmpresa: string;
  nombreContacto: string;
  email: string;
  telefono: string;
  direccion: string;
  fecha: Date;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'enviado';
  productos: ProductoPresupuesto[];
  logoEmpresa: string; // URL de la imagen del logotipo
  aceptaCorreosPublicitarios: boolean;
  cantidadTotal: number; // Para compatibilidad con código existente
  apuntes?: string; // Campo de notas/apuntes adicionales
}

export interface ProductoPresupuesto {
  id: number;
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
        nombreContacto: 'María García López',
        email: 'pedidos@dulcesbarcelona.com',
        telefono: '+34 932 123 456',
        direccion: 'Carrer de Balmes, 123, 08008 Barcelona',
        fecha: new Date('2024-01-15'),
        estado: 'pendiente',
        productos: [
          { id: 1, nombre: 'Chocolates Premium', categoria: 'Chocolates', cantidad: 100, precioUnitario: 12.50, precioTotal: 1250, imagen: '/assets/images/chocolate-premium.jpg' },
          { id: 2, nombre: 'Caramelos Artesanales', categoria: 'Caramelos', cantidad: 150, precioUnitario: 8.00, precioTotal: 1200, imagen: '/assets/images/caramelos-artesanales.jpg' }
        ],
        logoEmpresa: '/assets/images/logos/dulces-barcelona.jpg',
        aceptaCorreosPublicitarios: true,
        cantidadTotal: 250
      },
      {
        id: 1002,
        nombreEmpresa: 'Chocolates Madrid',
        nombreContacto: 'Carlos Rodríguez Sánchez',
        email: 'info@chocolatesmadrid.es',
        telefono: '+34 915 987 654',
        direccion: 'Calle Gran Vía, 45, 28013 Madrid',
        fecha: new Date('2024-01-16'),
        estado: 'aprobado',
        productos: [
          { id: 3, nombre: 'Bombones Gourmet', categoria: 'Chocolates', cantidad: 80, precioUnitario: 15.00, precioTotal: 1200, imagen: '/assets/images/bombones-gourmet.jpg' },
          { id: 4, nombre: 'Trufas de Chocolate', categoria: 'Chocolates', cantidad: 100, precioUnitario: 10.00, precioTotal: 1000, imagen: '/assets/images/trufas-chocolate.jpg' }
        ],
        logoEmpresa: '/assets/images/logos/chocolates-madrid.jpg',
        aceptaCorreosPublicitarios: false,
        cantidadTotal: 180
      },
      {
        id: 1003,
        nombreEmpresa: 'Caramelos Valencia',
        nombreContacto: 'Ana Martínez Pérez',
        email: 'compras@caramelosvalencia.com',
        telefono: '+34 963 456 789',
        direccion: 'Avenida del Puerto, 78, 46023 Valencia',
        fecha: new Date('2024-01-17'),
        estado: 'pendiente',
        productos: [
          { id: 5, nombre: 'Caramelos de Frutas', categoria: 'Caramelos', cantidad: 200, precioUnitario: 6.50, precioTotal: 1300, imagen: '/assets/images/caramelos-frutas.jpg' },
          { id: 6, nombre: 'Gominolas Artesanales', categoria: 'Gominolas', cantidad: 120, precioUnitario: 9.00, precioTotal: 1080, imagen: '/assets/images/gominolas-artesanales.jpg' }
        ],
        logoEmpresa: '/assets/images/logos/caramelos-valencia.jpg',
        aceptaCorreosPublicitarios: true,
        cantidadTotal: 320
      },
      {
        id: 1004,
        nombreEmpresa: 'Golosinas Sevilla',
        nombreContacto: 'Francisco Jiménez Ruiz',
        email: 'contacto@golosinassevilla.es',
        telefono: '+34 954 321 987',
        direccion: 'Calle Sierpes, 12, 41004 Sevilla',
        fecha: new Date('2024-01-18'),
        estado: 'rechazado',
        productos: [
          { id: 7, nombre: 'Chicles Artesanales', categoria: 'Chicles', cantidad: 50, precioUnitario: 4.50, precioTotal: 225, imagen: '/assets/images/chicles-artesanales.jpg' },
          { id: 8, nombre: 'Piruletas Gourmet', categoria: 'Piruletas', cantidad: 45, precioUnitario: 7.00, precioTotal: 315, imagen: '/assets/images/piruletas-gourmet.jpg' }
        ],
        logoEmpresa: '/assets/images/logos/golosinas-sevilla.jpg',
        aceptaCorreosPublicitarios: false,
        cantidadTotal: 95
      },
      {
        id: 1005,
        nombreEmpresa: 'Confitería Bilbao',
        nombreContacto: 'Elena Vázquez González',
        email: 'ventas@confiteriabilbao.com',
        telefono: '+34 944 567 123',
        direccion: 'Gran Vía Don Diego López de Haro, 56, 48011 Bilbao',
        fecha: new Date('2024-01-19'),
        estado: 'aprobado',
        productos: [
          { id: 9, nombre: 'Turrón Artesanal', categoria: 'Turrón', cantidad: 200, precioUnitario: 18.00, precioTotal: 3600, imagen: '/assets/images/turron-artesanal.jpg' },
          { id: 10, nombre: 'Mazapán Premium', categoria: 'Mazapán', cantidad: 220, precioUnitario: 14.00, precioTotal: 3080, imagen: '/assets/images/mazapan-premium.jpg' }
        ],
        logoEmpresa: '/assets/images/logos/confiteria-bilbao.jpg',
        aceptaCorreosPublicitarios: true,
        cantidadTotal: 420
      },
      {
        id: 1006,
        nombreEmpresa: 'Dulces Artesanos',
        nombreContacto: 'Roberto Fernández Castro',
        email: 'info@dulcesartesanos.es',
        telefono: '+34 987 654 321',
        direccion: 'Plaza Mayor, 8, 37002 Salamanca',
        fecha: new Date('2024-01-20'),
        estado: 'pendiente',
        productos: [
          { id: 11, nombre: 'Galletas Artesanales', categoria: 'Galletas', cantidad: 100, precioUnitario: 8.50, precioTotal: 850, imagen: '/assets/images/galletas-artesanales.jpg' },
          { id: 12, nombre: 'Mermeladas Gourmet', categoria: 'Mermeladas', cantidad: 50, precioUnitario: 12.00, precioTotal: 600, imagen: '/assets/images/mermeladas-gourmet.jpg' }
        ],
        logoEmpresa: '/assets/images/logos/dulces-artesanos.jpg',
        aceptaCorreosPublicitarios: true,
        cantidadTotal: 150
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
    // Navegar a la ficha de detalle del presupuesto
    this.router.navigate(['/logoadmin/presupuestos', id]);
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
