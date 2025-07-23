import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';

interface Categoria {
  id: number;
  nombre: string;
  numeroProductos: number;
  publicada: boolean;
  fechaCreacion: Date;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.css'
})
export class CategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  isLoading = true;
  
  // Estado del menú lateral
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
      active: false
    },
    {
      icon: '📂',
      label: 'Categorías',
      route: '/logoadmin/categorias',
      active: true
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

  ngOnInit(): void {
    this.loadUserData();
    this.loadCategorias();
  }

  /**
   * Cargar lista de categorías (datos simulados)
   */
  private loadCategorias(): void {
    // Simular carga de datos con delay
    setTimeout(() => {
      this.categorias = [
        {
          id: 1,
          nombre: 'Chocolates',
          numeroProductos: 45,
          publicada: true,
          fechaCreacion: new Date('2024-01-15')
        },
        {
          id: 2,
          nombre: 'Caramelos',
          numeroProductos: 32,
          publicada: true,
          fechaCreacion: new Date('2024-01-20')
        },
        {
          id: 3,
          nombre: 'Galletas',
          numeroProductos: 18,
          publicada: true,
          fechaCreacion: new Date('2024-02-01')
        },
        {
          id: 4,
          nombre: 'Navidad',
          numeroProductos: 12,
          publicada: false,
          fechaCreacion: new Date('2024-11-01')
        },
        {
          id: 5,
          nombre: 'Novedades',
          numeroProductos: 8,
          publicada: true,
          fechaCreacion: new Date('2024-12-01')
        },
        {
          id: 6,
          nombre: 'Dulces Especiales',
          numeroProductos: 0,
          publicada: false,
          fechaCreacion: new Date('2024-12-15')
        }
      ];
      
      this.isLoading = false;
    }, 800);
  }

  /**
   * Alternar estado de publicación de una categoría
   */
  togglePublicacion(categoria: Categoria): void {
    categoria.publicada = !categoria.publicada;
    console.log(`Categoría "${categoria.nombre}" ${categoria.publicada ? 'publicada' : 'despublicada'}`);
  }

  /**
   * Obtener clase CSS para el estado de publicación
   */
  getEstadoClass(publicada: boolean): string {
    return publicada ? 'badge-success' : 'badge-warning';
  }

  /**
   * Obtener texto del estado de publicación
   */
  getEstadoTexto(publicada: boolean): string {
    return publicada ? 'Publicada' : 'Borrador';
  }

  /**
   * Obtener número de categorías publicadas
   */
  getCategoriasPublicadas(): number {
    return this.categorias.filter(cat => cat.publicada).length;
  }

  /**
   * Obtener total de productos en todas las categorías
   */
  getTotalProductos(): number {
    return this.categorias.reduce((sum, cat) => sum + cat.numeroProductos, 0);
  }

  /**
   * Cargar datos del usuario
   */
  private loadUserData(): void {
    const username = this.authService.getCurrentUser();
    if (username) {
      this.currentUser = {
        username: username,
        role: 'admin',
        loginTime: new Date().toISOString()
      };
    }
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
    
    // Auto-ocultar menú en móvil al seleccionar nav-item
    const isMobile = window.innerWidth <= 768;
    if (isMobile && !this.sidebarService.isCollapsed) {
      this.sidebarService.closeSidebar();
      console.log('Auto-ocultando menú en móvil al seleccionar nav-item - ancho:', window.innerWidth);
    }
    
    // Navegar a la ruta
    this.router.navigate([route]);
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.authService.logout();
  }
}
