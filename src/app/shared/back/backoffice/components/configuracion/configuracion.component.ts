import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';

interface ConfiguracionData {
  seo: {
    homeTitle: string;
    homeDescription: string;
    homeKeywords: string;
    siteName: string;
    defaultImage: string;
  };
  footer: {
    contactoTelefono: string;
    contactoEmail: string;
    contactoDireccion: string;
    horarioAtencion: string;
    queEsLogolate: string;
    redesSociales: {
      instagram: string;
    };
  };
  general: {
    logoHeader: string;
    logoFooter: string;
    favicon: string;
  };
  banner: {
    banners: Array<{
      id: number;
      titulo: string;
      subtitulo: string;
      imagen: string;
      enlace: string;
      activo: boolean;
      orden: number;
      nombreBoton: string;
      colorBoton: string;
      colorTitulos: string;
    }>;
  };
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
  // Estado del menú lateral
  sidebarCollapsed = false;
  currentUser: any = null;

  // Pestañas activas
  activeTab = 'seo';
  tabs = [
    { id: 'seo', label: 'SEO', icon: '🔍' },
    { id: 'footer', label: 'Footer', icon: '📄' },
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'banner', label: 'Banner', icon: '🎨' }
  ];

  // Formularios para cada pestaña
  seoForm!: FormGroup;
  footerForm!: FormGroup;
  generalForm!: FormGroup;
  bannerForm!: FormGroup;

  // Estado de carga
  isLoading = true;
  isSaving = false;

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
      active: false
    },
    {
      icon: '⚙️',
      label: 'Opciones Generales',
      route: '/logoadmin/configuracion',
      active: true
    }
  ];

  // Datos de configuración
  configuracionData: ConfiguracionData = {
    seo: {
      homeTitle: 'Logolate - Dulces Artesanales Premium',
      homeDescription: 'Descubre nuestra selección de chocolates, caramelos y dulces artesanales. Calidad premium para momentos especiales.',
      homeKeywords: 'chocolates, caramelos, dulces artesanales, premium, logolate',
      siteName: 'Logolate',
      defaultImage: '/assets/images/logo-social.jpg'
    },
    footer: {
      contactoTelefono: '+34 123 456 789',
      contactoEmail: 'info@logolate.com',
      contactoDireccion: 'Calle Dulce, 123, 28001 Madrid',
      horarioAtencion: 'Lunes a Viernes: 9:00 - 18:00',
      queEsLogolate: 'Logolate es una empresa dedicada a la creación de dulces artesanales premium. Desde 2020, nos especializamos en chocolates, caramelos y galletas de la más alta calidad.',
      redesSociales: {
        instagram: 'https://instagram.com/logolate'
      }
    },
    general: {
      logoHeader: '/assets/images/logo-header.png',
      logoFooter: '/assets/images/logo-footer.png',
      favicon: '/assets/images/favicon.ico'
    },
    banner: {
      banners: [
        {
          id: 1,
          titulo: 'Dulces Artesanales Premium',
          subtitulo: 'Descubre nuestra colección exclusiva',
          imagen: '/assets/images/banner-1.jpg',
          enlace: '/productos',
          activo: true,
          orden: 1,
          nombreBoton: 'Ver Productos',
          colorBoton: '#8B4513',
          colorTitulos: '#FFFFFF'
        },
        {
          id: 2,
          titulo: 'Chocolates de Temporada',
          subtitulo: 'Edición limitada disponible',
          imagen: '/assets/images/banner-2.jpg',
          enlace: '/productos/chocolates',
          activo: true,
          orden: 2,
          nombreBoton: 'Comprar Ahora',
          colorBoton: '#D2691E',
          colorTitulos: '#FFFFFF'
        }
      ]
    }
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    public sidebarService: SidebarService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadConfiguracion();
  }

  /**
   * Inicializar todos los formularios
   */
  private initializeForms(): void {
    // Formulario SEO
    this.seoForm = this.fb.group({
      homeTitle: ['', [Validators.required, Validators.maxLength(60)]],
      homeDescription: ['', [Validators.required, Validators.maxLength(160)]],
      homeKeywords: ['', Validators.required],
      siteName: ['', Validators.required],
      defaultImage: ['']
    });

    // Formulario Footer
    this.footerForm = this.fb.group({
      contactoTelefono: ['', Validators.required],
      contactoEmail: ['', [Validators.required, Validators.email]],
      contactoDireccion: ['', Validators.required],
      horarioAtencion: ['', Validators.required],
      queEsLogolate: ['', [Validators.required, Validators.maxLength(500)]],
      instagram: ['']
    });

    // Formulario General
    this.generalForm = this.fb.group({
      logoHeader: [''],
      logoFooter: [''],
      favicon: ['']
    });

    // Formulario Banner (se manejará dinámicamente)
    this.bannerForm = this.fb.group({});
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
   * Cargar configuración actual
   */
  private loadConfiguracion(): void {
    setTimeout(() => {
      // Cargar datos en los formularios
      this.seoForm.patchValue(this.configuracionData.seo);
      this.footerForm.patchValue({
        ...this.configuracionData.footer,
        instagram: this.configuracionData.footer.redesSociales.instagram
      });
      this.generalForm.patchValue(this.configuracionData.general);
      
      this.isLoading = false;
    }, 800);
  }

  /**
   * Cambiar pestaña activa
   */
  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  /**
   * Guardar configuración de la pestaña actual
   */
  saveCurrentTab(): void {
    let formToSave: FormGroup;
    let dataSection: string;

    switch (this.activeTab) {
      case 'seo':
        formToSave = this.seoForm;
        dataSection = 'SEO';
        break;
      case 'footer':
        formToSave = this.footerForm;
        dataSection = 'Footer';
        break;
      case 'general':
        formToSave = this.generalForm;
        dataSection = 'General';
        break;
      case 'banner':
        formToSave = this.bannerForm;
        dataSection = 'Banner';
        break;
      default:
        return;
    }

    if (formToSave.valid) {
      this.isSaving = true;
      
      // Simular guardado
      setTimeout(() => {
        console.log(`Guardando configuración de ${dataSection}:`, formToSave.value);
        this.isSaving = false;
        
        // Mostrar mensaje de éxito (aquí podrías usar un toast)
        alert(`Configuración de ${dataSection} guardada exitosamente`);
      }, 1000);
    } else {
      alert('Por favor, complete todos los campos requeridos');
    }
  }

  /**
   * Agregar nuevo banner
   */
  addBanner(): void {
    const newBanner = {
      id: Date.now(),
      titulo: '',
      subtitulo: '',
      imagen: '',
      enlace: '',
      activo: true,
      orden: this.configuracionData.banner.banners.length + 1,
      nombreBoton: 'Ver Más',
      colorBoton: '#3B82F6',
      colorTitulos: '#FFFFFF'
    };
    
    this.configuracionData.banner.banners.push(newBanner);
  }

  /**
   * Eliminar banner
   */
  removeBanner(bannerId: number): void {
    if (confirm('¿Está seguro de que desea eliminar este banner?')) {
      this.configuracionData.banner.banners = this.configuracionData.banner.banners
        .filter(banner => banner.id !== bannerId);
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

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.authService.logout();
  }
}
