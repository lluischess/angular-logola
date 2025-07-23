import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';

export interface Producto {
  id: number;
  referencia: string;
  nombre: string;
  categoria: string;
  cantidadMinima: number;
  imagen: string;
  fechaCreacion: Date;
  publicado: boolean;
  ordenCategoria: number;
  medidas?: string;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  filteredProductos: Producto[] = [];
  
  // Filtros
  filtroId: string = '';
  filtroReferencia: string = '';
  filtroCategoria: string = '';
  filtroCantidadMinima: string = '';
  filtroPublicado: string = '';
  filtroOrden: string = '';

  // Ordenamiento - por defecto por categoría
  sortColumn: string = 'categoria';
  sortDirection: 'asc' | 'desc' = 'asc';
  
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
      active: false
    },
    {
      icon: '🍫',
      label: 'Productos',
      route: '/logoadmin/productos',
      active: true
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
    this.filteredProductos = [...this.productos];
    this.loadUserData();
  }

  loadMockData() {
    this.productos = [
      {
        id: 1,
        referencia: 'BE-015-156',
        nombre: 'BOMBÓN NAVIDAD EN BOLSA UNITARIA PERSONALIZADA',
        categoria: 'chocolates',
        cantidadMinima: 50,
        imagen: 'assets/images/BE-015-156.jpg',
        fechaCreacion: new Date('2023-10-15'),
        publicado: true,
        ordenCategoria: 1,
        medidas: 'Medidas 72 x 59 mm'
      },
      {
        id: 2,
        referencia: 'EN-148',
        nombre: 'Bote personalizado con Bolas de Cereales con Chocolate',
        categoria: 'chocolates',
        cantidadMinima: 25,
        imagen: 'assets/images/EN-148.jpg',
        fechaCreacion: new Date('2023-11-20'),
        publicado: true,
        ordenCategoria: 2,
        medidas: 'Medidas 72 x 59 mm'
      },
      {
        id: 3,
        referencia: 'EN-134',
        nombre: 'Bote personalizado con Catanias',
        categoria: 'chocolates',
        cantidadMinima: 30,
        imagen: 'assets/images/EN-134.jpg',
        fechaCreacion: new Date('2023-09-10'),
        publicado: false,
        ordenCategoria: 3,
        medidas: 'Medidas 72 x 59 mm'
      },
      {
        id: 4,
        referencia: 'SS-201-003',
        nombre: 'Catánias 35g en estuche Medium Faja',
        categoria: 'chocolates',
        cantidadMinima: 100,
        imagen: 'assets/images/SS-201-003.jpg',
        fechaCreacion: new Date('2024-01-05'),
        publicado: true,
        ordenCategoria: 4,
        medidas: 'Medidas 60 x 60 x 55 mm'
      },
      {
        id: 5,
        referencia: 'SS-202',
        nombre: 'Bombon de Yogur y Fresa cubo medium',
        categoria: 'chocolates',
        cantidadMinima: 75,
        imagen: 'assets/images/SS-202.jpg',
        fechaCreacion: new Date('2023-12-12'),
        publicado: true,
        ordenCategoria: 5,
        medidas: 'Medidas 60 x 40 x 55 mm'
      },
      {
        id: 6,
        referencia: 'CO-000',
        nombre: 'Chocolates Levels Piramid',
        categoria: 'chocolates',
        cantidadMinima: 20,
        imagen: 'assets/images/CO-000.jpg',
        fechaCreacion: new Date('2023-08-25'),
        publicado: false,
        ordenCategoria: 6,
        medidas: 'Medidas 13 x 13 x 9,5 cm'
      },
      {
        id: 7,
        referencia: 'FC-056-01',
        nombre: 'Cub Gajos Jelly',
        categoria: 'caramelos',
        cantidadMinima: 40,
        imagen: 'assets/images/FC-056-01.jpg',
        fechaCreacion: new Date('2023-11-30'),
        publicado: true,
        ordenCategoria: 1,
        medidas: 'Medidas 5 x 5 x 5 cm'
      },
      {
        id: 8,
        referencia: 'FC-307-01',
        nombre: 'Caja Pastis con Moras de Colores',
        categoria: 'caramelos',
        cantidadMinima: 60,
        imagen: 'assets/images/FC-307-01.jpg',
        fechaCreacion: new Date('2024-01-15'),
        publicado: true,
        ordenCategoria: 2,
        medidas: 'Medidas 5 x 5 x 5 cm'
      },
      {
        id: 9,
        referencia: 'FC-036',
        nombre: 'Tetris de Gominola',
        categoria: 'caramelos',
        cantidadMinima: 35,
        imagen: 'assets/images/FC-036.jpg',
        fechaCreacion: new Date('2023-07-18'),
        publicado: false,
        ordenCategoria: 3,
        medidas: 'Medidas 7 x 7 x 7 cm'
      },
      {
        id: 10,
        referencia: 'SS-012',
        nombre: 'Cata 9 Bombones Artesanos',
        categoria: 'novedades',
        cantidadMinima: 15,
        imagen: 'assets/images/SS-012.jpg',
        fechaCreacion: new Date('2024-01-20'),
        publicado: true,
        ordenCategoria: 1,
        medidas: 'Medidas 10 x 10 x 2,5 cm'
      },
      {
        id: 11,
        referencia: 'NA-040',
        nombre: 'CALENDARIO ADVIENTO LUX',
        categoria: 'navidad',
        cantidadMinima: 10,
        imagen: 'assets/images/NA-040.jpg',
        fechaCreacion: new Date('2023-09-01'),
        publicado: true,
        ordenCategoria: 1,
        medidas: 'Medidas 330 x 130 x 45 mm'
      },
      {
        id: 12,
        referencia: 'NA-032-000',
        nombre: 'CALENDARIO ADVIENTO BOMBONES LINDOR LINDT',
        categoria: 'navidad',
        cantidadMinima: 25,
        imagen: 'assets/images/NA-032-000.jpg',
        fechaCreacion: new Date('2023-10-01'),
        publicado: false,
        ordenCategoria: 2,
        medidas: 'Medidas 250 x 250 x 30mm'
      },
      {
        id: 13,
        referencia: 'LOTE-003-01',
        nombre: 'Estuche con Benjamín y Bombones Lindor',
        categoria: 'navidad',
        cantidadMinima: 20,
        imagen: 'assets/images/LOTE-003-01.jpg',
        fechaCreacion: new Date('2023-11-05'),
        publicado: true,
        ordenCategoria: 3,
        medidas: 'Medidas 120 x 63 x 200 mm'
      },
      {
        id: 14,
        referencia: 'FL-023',
        nombre: 'Galleta Artesana',
        categoria: 'galletas',
        cantidadMinima: 100,
        imagen: 'assets/images/FL-023.jpg',
        fechaCreacion: new Date('2023-12-01'),
        publicado: true,
        ordenCategoria: 1,
        medidas: 'Medidas 5,4 x 4,5 cm'
      }
    ];
  }

  applyFilters() {
    this.filteredProductos = this.productos.filter(producto => {
      return (
        (this.filtroId === '' || producto.id.toString().includes(this.filtroId)) &&
        (this.filtroReferencia === '' || producto.referencia.toLowerCase().includes(this.filtroReferencia.toLowerCase())) &&
        (this.filtroCategoria === '' || producto.categoria.toLowerCase().includes(this.filtroCategoria.toLowerCase())) &&
        (this.filtroCantidadMinima === '' || producto.cantidadMinima.toString().includes(this.filtroCantidadMinima)) &&
        (this.filtroPublicado === '' || 
          (this.filtroPublicado === 'si' && producto.publicado) ||
          (this.filtroPublicado === 'no' && !producto.publicado) ||
          this.filtroPublicado === 'todos') &&
        (this.filtroOrden === '' || producto.ordenCategoria.toString().includes(this.filtroOrden))
      );
    });
    this.sortFilteredData();
  }

  clearFilters() {
    this.filtroId = '';
    this.filtroReferencia = '';
    this.filtroCategoria = '';
    this.filtroCantidadMinima = '';
    this.filtroPublicado = '';
    this.filtroOrden = '';
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
    this.productos.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'referencia':
          aValue = a.referencia.toLowerCase();
          bValue = b.referencia.toLowerCase();
          break;
        case 'categoria':
          aValue = a.categoria.toLowerCase();
          bValue = b.categoria.toLowerCase();
          break;
        case 'cantidadMinima':
          aValue = a.cantidadMinima;
          bValue = b.cantidadMinima;
          break;
        case 'fechaCreacion':
          aValue = a.fechaCreacion.getTime();
          bValue = b.fechaCreacion.getTime();
          break;
        case 'publicado':
          aValue = a.publicado ? 1 : 0;
          bValue = b.publicado ? 1 : 0;
          break;
        case 'ordenCategoria':
          aValue = a.ordenCategoria;
          bValue = b.ordenCategoria;
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
    this.filteredProductos.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'referencia':
          aValue = a.referencia.toLowerCase();
          bValue = b.referencia.toLowerCase();
          break;
        case 'categoria':
          aValue = a.categoria.toLowerCase();
          bValue = b.categoria.toLowerCase();
          break;
        case 'cantidadMinima':
          aValue = a.cantidadMinima;
          bValue = b.cantidadMinima;
          break;
        case 'fechaCreacion':
          aValue = a.fechaCreacion.getTime();
          bValue = b.fechaCreacion.getTime();
          break;
        case 'publicado':
          aValue = a.publicado ? 1 : 0;
          bValue = b.publicado ? 1 : 0;
          break;
        case 'ordenCategoria':
          aValue = a.ordenCategoria;
          bValue = b.ordenCategoria;
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

  getPublicadoClass(publicado: boolean): string {
    return publicado ? 'estado-publicado' : 'estado-no-publicado';
  }

  getCategoriaClass(categoria: string): string {
    switch (categoria.toLowerCase()) {
      case 'chocolates': return 'categoria-chocolates';
      case 'caramelos': return 'categoria-caramelos';
      case 'novedades': return 'categoria-novedades';
      case 'navidad': return 'categoria-navidad';
      case 'galletas': return 'categoria-galletas';
      default: return 'categoria-default';
    }
  }

  viewProducto(id: number): void {
    console.log('Ver producto:', id);
    // Aquí iría la lógica para ver el detalle del producto
  }

  editProducto(id: number): void {
    console.log('Editar producto:', id);
    // Aquí iría la lógica para editar el producto
  }

  deleteProducto(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      this.productos = this.productos.filter(p => p.id !== id);
      this.applyFilters();
      console.log('Producto eliminado:', id);
    }
  }

  trackByFn(index: number, item: Producto): number {
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
