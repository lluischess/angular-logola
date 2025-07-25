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
  imagenes: {
    galeria: Array<{
      id: number;
      nombre: string;
      archivo: string;
      url: string;
      tamano: number;
      tipo: string;
      fechaSubida: string;
      categoria: string;
      descripcion: string;
    }>;
    categorias: string[];
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
    { id: 'banner', label: 'Banner', icon: '🎨' },
    { id: 'imagenes', label: 'Imágenes', icon: '🖼️' }
  ];

  // Formularios para cada pestaña
  seoForm!: FormGroup;
  footerForm!: FormGroup;
  generalForm!: FormGroup;
  bannerForm!: FormGroup;

  // Estado de carga
  isLoading = true;
  isSaving = false;
  sidebarOpen = false;
  recentUploads: Array<{name: string, uploadDate: Date}> = [];

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
    },
    imagenes: {
      galeria: [
        {
          id: 1,
          nombre: 'Logo Principal',
          archivo: 'logo-principal.png',
          url: '/assets/images/logo-principal.png',
          tamano: 45678,
          tipo: 'image/png',
          fechaSubida: '2024-01-15T10:30:00Z',
          categoria: 'logos',
          descripcion: 'Logo principal de la empresa'
        },
        {
          id: 2,
          nombre: 'Banner Inicio',
          archivo: 'banner-inicio.jpg',
          url: '/assets/images/banner-inicio.jpg',
          tamano: 123456,
          tipo: 'image/jpeg',
          fechaSubida: '2024-01-20T14:15:00Z',
          categoria: 'banners',
          descripcion: 'Banner principal de la página de inicio'
        }
      ],
      categorias: ['logos', 'banners', 'productos', 'iconos', 'fondos']
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
      case 'imagenes':
        // Para imágenes no usamos formulario tradicional, solo guardamos
        this.saveImagenes();
        return;
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
   * Guardar configuración de imágenes
   */
  saveImagenes(): void {
    this.isSaving = true;
    
    // Simular guardado
    setTimeout(() => {
      console.log('Guardando configuración de Imágenes:', this.configuracionData.imagenes);
      this.isSaving = false;
      
      // Mostrar mensaje de éxito
      alert('Configuración de Imágenes guardada exitosamente');
    }, 1000);
  }

  /**
   * Subir nueva imagen (versión compleja - mantenida para compatibilidad)
   */
  uploadImage(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP)');
        return;
      }

      // Validar tamano (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. El tamano máximo permitido es 5MB.');
        return;
      }

      // Crear nueva imagen
      const newImage = {
        id: this.configuracionData.imagenes.galeria.length + 1,
        nombre: file.name.split('.')[0],
        archivo: file.name,
        url: URL.createObjectURL(file), // En producción sería la URL del servidor
        tamano: file.size,
        tipo: file.type,
        fechaSubida: new Date().toISOString(),
        categoria: 'sin-categoria',
        descripcion: ''
      };

      this.configuracionData.imagenes.galeria.push(newImage);
      
      // Limpiar input
      event.target.value = '';
      
      console.log('Imagen subida:', newImage);
    }
  }

  /**
   * Subir imágenes de forma simple a /assets/images/
   */
  uploadSimpleImage(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          alert(`Archivo ${file.name}: Tipo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP)`);
          continue;
        }

        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          alert(`Archivo ${file.name}: Demasiado grande. El tamaño máximo permitido es 5MB.`);
          continue;
        }

        // Simular subida exitosa y agregar a la lista de recientes
        const uploadInfo = {
          name: file.name,
          uploadDate: new Date()
        };
        
        this.recentUploads.unshift(uploadInfo);
        
        // Mantener solo las últimas 10 subidas
        if (this.recentUploads.length > 10) {
          this.recentUploads = this.recentUploads.slice(0, 10);
        }
        
        console.log(`Imagen ${file.name} subida exitosamente a /assets/images/`);
      }
      
      // Limpiar input
      event.target.value = '';
      
      // Mostrar mensaje de éxito
      const fileCount = files.length;
      const message = fileCount === 1 
        ? 'Imagen subida exitosamente a /assets/images/' 
        : `${fileCount} imágenes subidas exitosamente a /assets/images/`;
      
      alert(message);
    }
  }

  /**
   * Eliminar imagen
   */
  removeImage(imageId: number): void {
    if (confirm('¿Está seguro de que desea eliminar esta imagen?')) {
      this.configuracionData.imagenes.galeria = this.configuracionData.imagenes.galeria
        .filter(image => image.id !== imageId);
    }
  }

  /**
   * Actualizar categoría de imagen
   */
  updateImageCategory(imageId: number, categoria: string): void {
    const image = this.configuracionData.imagenes.galeria.find(img => img.id === imageId);
    if (image) {
      image.categoria = categoria;
    }
  }

  /**
   * Actualizar descripción de imagen
   */
  updateImageDescription(imageId: number, descripcion: string): void {
    const image = this.configuracionData.imagenes.galeria.find(img => img.id === imageId);
    if (image) {
      image.descripcion = descripcion;
    }
  }

  /**
   * Formatear tamano de archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Copiar texto al portapapeles
   */
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      console.log('URL copiada al portapapeles');
      // Aquí podrías mostrar una notificación de éxito
    }).catch(err => {
      console.error('Error al copiar al portapapeles:', err);
    });
  }

  /**
   * Manejar cambio de categoría de imagen
   */
  onImageCategoryChange(imageId: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateImageCategory(imageId, target.value);
  }

  /**
   * Manejar cambio de descripción de imagen
   */
  onImageDescriptionChange(imageId: number, event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.updateImageDescription(imageId, target.value);
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
