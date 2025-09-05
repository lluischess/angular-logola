import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  active: boolean;
}

@Component({
  selector: 'app-backoffice-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './backoffice-sidebar.component.html',
  styleUrl: './backoffice-sidebar.component.css'
})
export class BackofficeSidebarComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  // Propiedades exactas del dashboard
  sidebarCollapsed = false;
  currentUser: any = null;

  menuItems: MenuItem[] = [
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
      active: false
    },
    {
      icon: '⚙️',
      label: 'Opciones Generales',
      route: '/logoadmin/configuracion',
      active: false
    }
  ];

  ngOnInit() {
    this.loadUserData();
    this.updateActiveMenuItem();
  }

  private loadUserData(): void {
    const username = this.authService.getCurrentUsername();
    if (username) {
      this.currentUser = {
        username: username,
        role: 'Administrador'
      };
    } else {
      // Fallback si no hay usuario logueado
      this.currentUser = {
        username: 'Admin',
        role: 'Administrador'
      };
    }
  }

  updateActiveMenuItem() {
    const currentRoute = this.router.url;
    this.menuItems.forEach(item => {
      item.active = currentRoute.startsWith(item.route);
    });
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
    if (isMobile && !this.sidebarCollapsed) {
      this.sidebarCollapsed = true;
      //console.log('Auto-ocultando menú en móvil al seleccionar nav-item - ancho:', window.innerWidth);
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

  isMobile(): boolean {
    return window.innerWidth <= 768;
  }
}
