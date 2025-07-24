import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';
import { Presupuesto, ProductoPresupuesto } from '../presupuestos/presupuestos.component';

@Component({
  selector: 'app-presupuesto-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './presupuesto-detalle.component.html',
  styleUrls: ['./presupuesto-detalle.component.css']
})
export class PresupuestoDetalleComponent implements OnInit {
  presupuesto: Presupuesto | null = null;
  isLoading = true;
  currentUser: any = null;
  editingNotes = false;
  tempNotes = '';

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
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    public sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadPresupuesto();
  }

  private loadPresupuesto(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // Simular carga de datos (en producción vendría de un servicio)
      setTimeout(() => {
        this.presupuesto = this.getMockPresupuesto(parseInt(id));
        this.isLoading = false;
      }, 500);
    } else {
      this.router.navigate(['/logoadmin/presupuestos']);
    }
  }

  private getMockPresupuesto(id: number): Presupuesto | null {
    // Datos mock completos (en producción vendría de un servicio)
    const presupuestos: Presupuesto[] = [
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
        cantidadTotal: 250,
        apuntes: 'Cliente recurrente. Prefiere entregas los martes. Solicita facturación a final de mes.'
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
        cantidadTotal: 180,
        apuntes: 'Empresa premium. Requiere embalaje especial y certificado de calidad.'
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
        cantidadTotal: 320,
        apuntes: 'Nuevo cliente. Interesado en productos sin azúcar. Contactar antes del envío.'
      }
    ];

    return presupuestos.find(p => p.id === id) || null;
  }

  // Métodos de utilidad
  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'aprobado': return 'estado-aprobado';
      case 'rechazado': return 'estado-rechazado';
      case 'pendiente': return 'estado-pendiente';
      case 'enviado': return 'estado-enviado';
      default: return '';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'aprobado': return '✅';
      case 'rechazado': return '❌';
      case 'pendiente': return '⏳';
      case 'enviado': return '📧';
      default: return '❓';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  // Acciones
  editarPresupuesto(): void {
    if (this.presupuesto) {
      console.log('Editar presupuesto:', this.presupuesto.id);
      // Implementar lógica de edición
    }
  }

  cambiarEstado(nuevoEstado: 'pendiente' | 'aprobado' | 'rechazado' | 'enviado'): void {
    if (this.presupuesto) {
      this.presupuesto.estado = nuevoEstado;
      console.log('Estado cambiado a:', nuevoEstado);
      // Implementar lógica de guardado
    }
  }

  exportarPDF(): void {
    console.log('Exportar a PDF');
    // Implementar lógica de exportación a PDF
  }

  volverALista(): void {
    this.router.navigate(['/logoadmin/presupuestos']);
  }

  // Métodos para gestión de apuntes
  editarApuntes(): void {
    this.editingNotes = true;
    this.tempNotes = this.presupuesto?.apuntes || '';
  }

  guardarApuntes(): void {
    if (this.presupuesto) {
      this.presupuesto.apuntes = this.tempNotes;
      this.editingNotes = false;
      console.log('Apuntes guardados:', this.tempNotes);
      // Implementar lógica de guardado en el backend
    }
  }

  cancelarEdicionApuntes(): void {
    this.editingNotes = false;
    this.tempNotes = '';
  }

  // Sidebar methods
  private loadUserData(): void {
    const userData = localStorage.getItem('backoffice_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    } else {
      this.currentUser = {
        username: 'Admin',
        role: 'Administrador'
      };
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  navigateTo(route: string): void {
    this.menuItems.forEach(item => {
      item.active = item.route === route;
    });

    // Auto-ocultar menú en móvil al seleccionar nav-item
    const isMobile = window.innerWidth <= 768;
    if (isMobile && !this.sidebarService.isCollapsed) {
      this.sidebarService.closeSidebar();
      console.log('Auto-ocultando menú en móvil al seleccionar nav-item - ancho:', window.innerWidth);
    }

    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
  }

  /**
   * Verificar si es dispositivo móvil
   */
  isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  /**
   * Manejar errores de carga de imágenes
   */
  onImageError(event: Event, fallbackType: 'logo' | 'product'): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.dataset['fallbackApplied']) {
      // Marcar que ya se aplicó el fallback para evitar bucles
      target.dataset['fallbackApplied'] = 'true';
      
      // Usar SVG inline como fallback
      if (fallbackType === 'logo') {
        target.src = 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">
            <rect width="120" height="80" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
            <text x="60" y="35" text-anchor="middle" font-family="Arial" font-size="12" fill="#6c757d">Sin Logo</text>
            <text x="60" y="50" text-anchor="middle" font-family="Arial" font-size="10" fill="#adb5bd">Empresa</text>
          </svg>
        `);
      } else {
        target.src = 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
            <rect width="60" height="60" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
            <text x="30" y="30" text-anchor="middle" font-family="Arial" font-size="10" fill="#6c757d">Sin</text>
            <text x="30" y="42" text-anchor="middle" font-family="Arial" font-size="10" fill="#6c757d">Imagen</text>
          </svg>
        `);
      }
    }
  }
}
