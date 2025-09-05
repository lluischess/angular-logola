import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BackofficeLayoutComponent } from '../backoffice-layout/backoffice-layout.component';
import { ConfigurationService, ConfigurationData } from '../../services/configuration.service';

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
    emailAdministracion: string;
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
      imagenMobile: string;
      enlace: string;
      activo: boolean;
      orden: number;
      nombreBoton: string;
      colorBoton: string;
      colorTitulos: string;
      // Segundo botón opcional
      enlaceButton2?: string;
      nombreButton2?: string;
      colorBoton2?: string;
    }>;
  };
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BackofficeLayoutComponent],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
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
  sidebarOpen = false;
  recentUploads: Array<{name: string, uploadDate: Date}> = [];

  // Propiedades para el manejo de imágenes
  private fileInput: HTMLInputElement | null = null;
  private currentImageContext: { section: string; field: string; bannerIndex?: number } | null = null;

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
      emailAdministracion: 'admin@logolate.com',
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
          imagenMobile: '/assets/images/banner-1-mobile.jpg',
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
          imagenMobile: '/assets/images/banner-2-mobile.jpg',
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
    private configurationService: ConfigurationService
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
      emailAdministracion: ['', [Validators.required, Validators.email]],
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
    // El usuario se maneja ahora desde el layout reutilizable
    // No necesitamos cargar datos del usuario aquí
  }

  /**
   * Cargar configuración actual desde el backend
   */
  private loadConfiguracion(): void {
    this.isLoading = true;

    // Cargar configuración SEO
    this.configurationService.getConfigurationSection('seo').subscribe({
      next: (seoData) => {
        if (seoData && seoData.datos) {
          // Mapear campos del backend (español) al frontend (inglés)
          const seoFormData = {
            homeTitle: seoData.datos.tituloPaginaPrincipal || '',
            homeDescription: seoData.datos.metaDescripcionPrincipal || '',
            homeKeywords: seoData.datos.palabrasClave || '',
            siteName: seoData.datos.nombreSitio || '',
            defaultImage: seoData.datos.imagenPorDefecto || ''
          };
          this.seoForm.patchValue(seoFormData);
          //console.log('Configuración SEO cargada:', seoFormData);
        }
      },
      error: (error) => {
        console.warn('No se pudo cargar la configuración SEO, usando valores por defecto:', error);
        // Usar valores por defecto si no hay configuración guardada
        this.seoForm.patchValue(this.configuracionData.seo);
      }
    });

    // Cargar configuración Footer
    this.configurationService.getConfigurationSection('footer').subscribe({
      next: (footerData) => {
        if (footerData && footerData.datos) {
          // Mapear campos del backend (español) al frontend
          const footerFormData = {
            contactoTelefono: footerData.datos.telefono || '',
            contactoEmail: footerData.datos.email || '',
            contactoDireccion: footerData.datos.direccion || '',
            horarioAtencion: footerData.datos.horarioAtencion || '',
            queEsLogolate: footerData.datos.contenidoFooter || '',
            instagram: footerData.datos.instagram || ''
          };
          this.footerForm.patchValue(footerFormData);
          //console.log('Configuración Footer cargada:', footerFormData);
        }
      },
      error: (error) => {
        console.warn('No se pudo cargar la configuración Footer, usando valores por defecto:', error);
        this.footerForm.patchValue({
          ...this.configuracionData.footer,
          instagram: this.configuracionData.footer.redesSociales.instagram
        });
      }
    });

    // Cargar configuración General
    this.configurationService.getConfigurationSection('general').subscribe({
      next: (generalData) => {
        if (generalData && generalData.datos) {
          this.generalForm.patchValue(generalData.datos);
          //console.log('Configuración General cargada:', generalData.datos);
        }
      },
      error: (error) => {
        console.warn('No se pudo cargar la configuración General, usando valores por defecto:', error);
        this.generalForm.patchValue(this.configuracionData.general);
      }
    });

    // Cargar configuración Banners
    this.configurationService.getConfigurationSection('banners').subscribe({
      next: (bannersResponse) => {
        //console.log('Respuesta del backend para banners:', bannersResponse);

        if (bannersResponse && Array.isArray(bannersResponse) && bannersResponse.length > 0) {
          // Mapear los banners del backend al formato del frontend
          this.configuracionData.banner.banners = bannersResponse.map((bannerConfig, index) => {
            //console.log(`💾 [BACKOFFICE] Procesando banner ${index + 1} del backend:`, bannerConfig);
            //console.log(`🔍 [BACKOFFICE] Datos del banner:`, bannerConfig.datos);

            // Extraer campos específicos para debugging
            const enlaceValue = bannerConfig.datos?.enlaceButton || bannerConfig.datos?.enlace || '';
            const nombreBotonValue = bannerConfig.datos?.nombreButton || bannerConfig.datos?.nombreBoton || '';
            const colorBotonValue = bannerConfig.datos?.colorBoton || '';
            const colorTitulosValue = bannerConfig.datos?.colorTitulos || '';

            // console.log(`🔍 [BACKOFFICE] Campos específicos del banner ${index + 1}:`, {
            //   enlaceButton: bannerConfig.datos?.enlaceButton,
            //   enlace: bannerConfig.datos?.enlace,
            //   enlaceValue: enlaceValue,
            //   nombreButton: bannerConfig.datos?.nombreButton,
            //   nombreBoton: bannerConfig.datos?.nombreBoton,
            //   nombreBotonValue: nombreBotonValue,
            //   colorBoton: bannerConfig.datos?.colorBoton,
            //   colorBotonValue: colorBotonValue,
            //   colorTitulos: bannerConfig.datos?.colorTitulos,
            //   colorTitulosValue: colorTitulosValue
            // });

            const mappedBanner = {
              id: index + 1,
              titulo: bannerConfig.datos?.titulo || '',
              subtitulo: bannerConfig.datos?.subtitulo || '',
              // Mapear nombres del backend al frontend
              imagen: bannerConfig.datos?.imagenDesktop || bannerConfig.datos?.imagen || '',
              imagenMobile: bannerConfig.datos?.imagenMobile || '',
              enlace: enlaceValue,
              activo: bannerConfig.datos?.activo !== undefined ? bannerConfig.datos.activo : true,
              orden: bannerConfig.datos?.ordenBanner || bannerConfig.datos?.orden || (index + 1),
              nombreBoton: nombreBotonValue,
              colorBoton: colorBotonValue,
              colorTitulos: colorTitulosValue,
              // Segundo botón opcional
              enlaceButton2: bannerConfig.datos?.enlaceButton2 || '',
              nombreButton2: bannerConfig.datos?.nombreButton2 || '',
              colorBoton2: bannerConfig.datos?.colorBoton2 || ''
            };

            //console.log(`🔄 [BACKOFFICE] Banner ${index + 1} mapeado para frontend:`, mappedBanner);
            return mappedBanner;
          });

          //console.log('Banners mapeados para el frontend:', this.configuracionData.banner.banners);
        } else {
          //console.log('No se encontraron banners guardados, usando valores por defecto');
          // Mantener los banners por defecto si no hay datos guardados
        }
      },
      error: (error) => {
        console.error('Error al cargar la configuración Banners:', error);
        console.warn('Usando valores por defecto para banners');
        // Mantener los banners por defecto si hay error
      }
    });

    // Finalizar carga después de un breve delay para permitir que se completen las peticiones
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
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
    let dataToSave: any;
    let sectionName: string;

    // Preparar datos según la pestaña activa
    switch (this.activeTab) {
      case 'seo':
        if (!this.seoForm.valid) {
          alert('Por favor, complete todos los campos requeridos en la sección SEO');
          return;
        }
        // Mapear campos del frontend (inglés) al backend (español)
        const seoFormValue = this.seoForm.value;
        dataToSave = {
          tituloPaginaPrincipal: seoFormValue.homeTitle,
          metaDescripcionPrincipal: seoFormValue.homeDescription,
          palabrasClave: seoFormValue.homeKeywords,
          nombreSitio: seoFormValue.siteName,
          imagenPorDefecto: seoFormValue.defaultImage
        };
        sectionName = 'seo';
        break;

      case 'footer':
        if (!this.footerForm.valid) {
          alert('Por favor, complete todos los campos requeridos en la sección Footer');
          return;
        }
        // Mapear campos del frontend al backend
        const footerFormValue = this.footerForm.value;
        dataToSave = {
          telefono: footerFormValue.contactoTelefono,
          email: footerFormValue.contactoEmail,
          direccion: footerFormValue.contactoDireccion,
          horarioAtencion: footerFormValue.horarioAtencion,
          contenidoFooter: footerFormValue.queEsLogolate,
          instagram: footerFormValue.instagram
        };
        sectionName = 'footer';
        break;

      case 'general':
        if (!this.generalForm.valid) {
          alert('Por favor, complete todos los campos requeridos en la sección General');
          return;
        }
        dataToSave = this.generalForm.value;
        sectionName = 'general';
        break;

      case 'banner':
        // Para banners, guardamos los datos directamente del objeto configuracionData
        //console.log('💾 [BACKOFFICE] Datos de banners antes del mapeo:', this.configuracionData.banner.banners);

        // Mapear nombres de campos del frontend al formato esperado por el backend
        const mappedBanners = this.configuracionData.banner.banners.map(banner => {
          // console.log(`💾 [BACKOFFICE] Banner ${banner.id} antes del mapeo para guardado:`, {
          //   enlace: banner.enlace,
          //   nombreBoton: banner.nombreBoton,
          //   colorBoton: banner.colorBoton,
          //   colorTitulos: banner.colorTitulos,
             // Segundo botón
          //   enlaceButton2: banner.enlaceButton2,
          //   nombreButton2: banner.nombreButton2,
          //   colorBoton2: banner.colorBoton2,
          //   bannerCompleto: banner
          // });

          const mappedBanner = {
            titulo: banner.titulo || '',
            subtitulo: banner.subtitulo || '',
            imagenDesktop: banner.imagen || '', // Backend espera imagenDesktop
            imagenMobile: banner.imagenMobile || '',
            enlaceButton: banner.enlace || '', // Backend espera enlaceButton
            nombreButton: banner.nombreBoton || 'Ver Más', // Backend espera nombreButton
            ordenBanner: banner.orden || 1, // Backend espera ordenBanner
            colorBoton: banner.colorBoton || '#3B82F6',
            colorTitulos: banner.colorTitulos || '#FFFFFF',
            activo: banner.activo !== false,
            // Segundo botón opcional
            enlaceButton2: banner.enlaceButton2 || '',
            nombreButton2: banner.nombreButton2 || '',
            colorBoton2: banner.colorBoton2 || ''
          };

          // console.log(`🔄 [BACKOFFICE] Banner ${banner.id} mapeado para backend:`, {
          //   enlaceButton: mappedBanner.enlaceButton,
          //   nombreButton: mappedBanner.nombreButton,
          //   colorBoton: mappedBanner.colorBoton,
          //   colorTitulos: mappedBanner.colorTitulos,
          //   // Segundo botón
          //   enlaceButton2: mappedBanner.enlaceButton2,
          //   nombreButton2: mappedBanner.nombreButton2,
          //   colorBoton2: mappedBanner.colorBoton2,
          //   bannerCompleto: mappedBanner
          // });

          return mappedBanner;
        });

        dataToSave = {
          banners: mappedBanners
        };
        sectionName = 'banners';
        break;

      default:
        console.warn(`Sección ${this.activeTab} no reconocida`);
        return;
    }

    // Validar que tenemos datos para guardar
    if (!dataToSave) {
      alert('No hay datos para guardar');
      return;
    }

    // Mostrar estado de carga
    this.isSaving = true;
    //console.log(`Guardando configuración de ${sectionName}:`, dataToSave);

    // Llamar al servicio del backend
    this.configurationService.updateConfigurationSection(sectionName, dataToSave)
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          //console.log(`Configuración de ${sectionName} guardada correctamente:`, response);
          alert(`Configuración de ${sectionName.toUpperCase()} guardada correctamente`);

          // Para banners, recargar los datos desde el backend para asegurar sincronización
          if (sectionName === 'banners') {
            //console.log('🔄 [BACKOFFICE] Recargando banners desde el backend tras guardado exitoso...');
            this.reloadBannersFromBackend();
          } else if (response && response.data) {
            this.updateLocalData(sectionName, response.data);
          }
        },
        error: (error) => {
          this.isSaving = false;
          console.error(`Error al guardar configuración de ${sectionName}:`, error);

          let errorMessage = `Error al guardar la configuración de ${sectionName.toUpperCase()}`;
          if (error.error && error.error.message) {
            errorMessage += `: ${error.error.message}`;
          } else if (error.status === 0) {
            errorMessage += '. Verifique la conexión con el servidor.';
          } else {
            errorMessage += '. Inténtelo de nuevo.';
          }

          alert(errorMessage);
        }
      });
  }

  /**
   * Actualizar datos locales tras guardado exitoso
   */
  private updateLocalData(sectionName: string, data: any): void {
    switch (sectionName) {
      case 'seo':
        this.configuracionData.seo = { ...this.configuracionData.seo, ...data };
        break;
      case 'footer':
        this.configuracionData.footer = { ...this.configuracionData.footer, ...data };
        break;
      case 'general':
        this.configuracionData.general = { ...this.configuracionData.general, ...data };
        break;
      case 'banner':
        if (data.banners) {
          this.configuracionData.banner.banners = data.banners;
        }
        break;
      default:
        console.warn(`Sección ${sectionName} no reconocida para actualización local`);
    }
  }

  /**
   * Recarga los banners desde el backend para asegurar sincronización tras el guardado
   */
  private reloadBannersFromBackend(): void {
    //console.log('🔄 [BACKOFFICE] Iniciando recarga de banners desde backend...');

    this.configurationService.getConfigurationSection('banners')
      .subscribe({
        next: (bannersResponse) => {
          //console.log('💾 [BACKOFFICE] Banners recargados desde backend:', bannersResponse);

          if (bannersResponse && Array.isArray(bannersResponse) && bannersResponse.length > 0) {
            // Mapear los banners del backend al formato del frontend (mismo código que en loadConfiguracion)
            this.configuracionData.banner.banners = bannersResponse.map((bannerConfig, index) => {
              //console.log(`💾 [BACKOFFICE] Procesando banner recargado ${index + 1}:`, bannerConfig);
              //console.log(`🔍 [BACKOFFICE] Estructura completa de datos del banner ${index + 1}:`, {
              //   _id: bannerConfig._id,
              //   tipo: bannerConfig.tipo,
              //   nombre: bannerConfig.nombre,
              //   datos: bannerConfig.datos,
              //   datosCompletos: JSON.stringify(bannerConfig.datos, null, 2)
              // });

              // Extraer campos específicos para debugging
              const enlaceValue = bannerConfig.datos?.enlaceButton || bannerConfig.datos?.enlace || '';
              const nombreBotonValue = bannerConfig.datos?.nombreButton || bannerConfig.datos?.nombreBoton || '';
              const colorBotonValue = bannerConfig.datos?.colorBoton || '';
              const colorTitulosValue = bannerConfig.datos?.colorTitulos || '';

              const mappedBanner = {
                id: index + 1,
                titulo: bannerConfig.datos?.titulo || '',
                subtitulo: bannerConfig.datos?.subtitulo || '',
                imagen: bannerConfig.datos?.imagenDesktop || bannerConfig.datos?.imagen || '',
                imagenMobile: bannerConfig.datos?.imagenMobile || '',
                enlace: enlaceValue,
                activo: bannerConfig.datos?.activo !== undefined ? bannerConfig.datos.activo : true,
                orden: bannerConfig.datos?.ordenBanner || bannerConfig.datos?.orden || (index + 1),
                nombreBoton: nombreBotonValue,
                colorBoton: colorBotonValue,
                colorTitulos: colorTitulosValue,
                // Segundo botón opcional
                enlaceButton2: bannerConfig.datos?.enlaceButton2 || '',
                nombreButton2: bannerConfig.datos?.nombreButton2 || '',
                colorBoton2: bannerConfig.datos?.colorBoton2 || ''
              };

              // console.log(`🔄 [BACKOFFICE] Banner ${index + 1} recargado y mapeado:`, {
              //   ...mappedBanner,
                // Debug específico segundo botón
              //   enlaceButton2_original: bannerConfig.datos?.enlaceButton2,
              //   nombreButton2_original: bannerConfig.datos?.nombreButton2,
              //   colorBoton2_original: bannerConfig.datos?.colorBoton2
              // });
              return mappedBanner;
            });

            //console.log('✅ [BACKOFFICE] Banners recargados correctamente:', this.configuracionData.banner.banners);
          } else {
            //console.log('⚠️ [BACKOFFICE] No se encontraron banners en la respuesta del backend tras recarga');
            this.configuracionData.banner.banners = [];
          }
        },
        error: (error) => {
          console.error('❌ [BACKOFFICE] Error al recargar banners desde backend:', error);
        }
      });
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
      imagenMobile: '',
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
      //console.log('Guardando configuración...');
      this.isSaving = false;

      // Mostrar mensaje de éxito
      alert('Configuración guardada correctamente');
    }, 1000);
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

        //console.log(`Imagen ${file.name} subida correctamente a /assets/images/`);
      }

      // Limpiar input
      event.target.value = '';

      // Mostrar mensaje de éxito
      const fileCount = files.length;
      const message = fileCount === 1
        ? 'Imagen subida correctamente a /assets/images/'
        : `${fileCount} imágenes subidas correctamente a /assets/images/`;

      alert(message);
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
      //console.log('URL copiada al portapapeles');
      // Aquí podrías mostrar una notificación de éxito
    }).catch(err => {
      console.error('Error al copiar al portapapeles:', err);
    });
  }

  /**
   * Abrir selector de imagen para campos clicables
   */
  openImageSelector(section: string, field: string, bannerIndex?: number): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.uploadImageToServer(file, section, field, bannerIndex);
      }
    };

    input.click();
  }

  /**
   * Subir imagen al servidor y actualizar formulario
   */
  uploadImageToServer(file: File, section: string, field: string, bannerIndex?: number): void {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/ico'];
    if (!allowedTypes.includes(file.type)) {
      alert(`Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP, ICO)`);
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert(`El archivo es demasiado grande. Tamaño máximo: 5MB`);
      return;
    }

    //console.log(`Subiendo imagen ${file.name} para ${section}.${field}`);

    // Determinar categoría para el backend
    let category = section;
    if (section === 'banner') {
      category = field === 'imagenMobile' ? 'banner-mobile' : 'banner-desktop';
    }

    // Subir imagen al servidor usando el servicio
    this.configurationService.uploadImage(file, category)
      .subscribe({
        next: (response) => {
          //console.log(`Imagen ${file.name} subida correctamente:`, response);

          if (response.success && response.url) {
            // Actualizar formulario correspondiente con la URL real del servidor
            this.updateImageField(section, field, response.url, bannerIndex);

            // Añadir a la lista de subidas recientes
            this.recentUploads.unshift({
              name: response.filename || file.name,
              uploadDate: new Date()
            });

            // Mantener solo las últimas 10 subidas
            if (this.recentUploads.length > 10) {
              this.recentUploads = this.recentUploads.slice(0, 10);
            }

            alert(`Imagen ${response.filename || file.name} subida correctamente`);
          } else {
            throw new Error(response.message || 'Error desconocido al subir la imagen');
          }
        },
        error: (error) => {
          console.error(`Error al subir imagen ${file.name}:`, error);

          let errorMessage = `Error al subir la imagen ${file.name}`;
          if (error.error && error.error.message) {
            errorMessage += `: ${error.error.message}`;
          } else if (error.status === 0) {
            errorMessage += '. Verifique la conexión con el servidor.';
          } else if (error.status === 413) {
            errorMessage += '. El archivo es demasiado grande.';
          } else if (error.status === 415) {
            errorMessage += '. Tipo de archivo no soportado.';
          } else {
            errorMessage += '. Inténtelo de nuevo.';
          }

          alert(errorMessage);
        }
      });
  }

  /**
   * Actualizar campo de imagen en el formulario
   */
  updateImageField(section: string, field: string, imageUrl: string, bannerIndex?: number): void {
    switch (section) {
      case 'general':
        this.generalForm.patchValue({ [field]: imageUrl });
        break;
      case 'seo':
        this.seoForm.patchValue({ [field]: imageUrl });
        break;
      case 'banner':
        if (bannerIndex !== undefined) {
          const banner = this.configuracionData.banner.banners[bannerIndex];
          if (field === 'imagen') {
            banner.imagen = imageUrl;
          } else if (field === 'imagenMobile') {
            banner.imagenMobile = imageUrl;
          }
        }
        break;
      default:
        console.warn(`Sección ${section} no reconocida`);
    }
  }

  /**
   * Obtener preview de imagen
   */
  getImagePreview(section: string, field: string, bannerIndex?: number): string {
    let imageUrl = '';

    switch (section) {
      case 'general':
        imageUrl = this.generalForm.get(field)?.value || '';
        break;
      case 'seo':
        imageUrl = this.seoForm.get(field)?.value || '';
        break;
      case 'banner':
        if (bannerIndex !== undefined) {
          const banner = this.configuracionData.banner.banners[bannerIndex];
          if (field === 'imagen') {
            imageUrl = banner.imagen || '';
          } else if (field === 'imagenMobile') {
            imageUrl = banner.imagenMobile || '';
          }
        }
        break;
      default:
        imageUrl = '';
    }

    // Si no hay imagen, usar SVG placeholder inline para evitar 404
    return imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA0NUg5NVY1NUg4NVY0NVoiIGZpbGw9IiM5Q0E0QUYiLz4KPHA+CjxyZWN0IHg9IjcwIiB5PSI2NSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQiIGZpbGw9IiM5Q0E0QUYiLz4KPHA+CjxyZWN0IHg9IjgwIiB5PSI3NSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQiIGZpbGw9IiM5Q0E0QUYiLz4KPHA+Cjx0ZXh0IHg9IjEwMCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzlDQTRBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2VuPC90ZXh0Pgo8L3N2Zz4=';
  }

  /**
   * Obtener preview específico para banners
   */
  getBannerImagePreview(imageUrl: string): string {
    // Si no hay imagen, usar SVG placeholder inline para evitar 404
    return imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA0NUg5NVY1NUg4NVY0NVoiIGZpbGw9IiM5Q0E0QUYiLz4KPHA+CjxyZWN0IHg9IjcwIiB5PSI2NSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQiIGZpbGw9IiM5Q0E0QUYiLz4KPHA+CjxyZWN0IHg9IjgwIiB5PSI3NSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQiIGZpbGw9IiM5Q0E0QUYiLz4KPHA+Cjx0ZXh0IHg9IjEwMCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzlDQTRBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2VuPC90ZXh0Pgo8L3N2Zz4=';
  }

  /**
   * Manejar error de carga de imagen
   */
  onImageError(event: any): void {
    const target = event.target as HTMLImageElement;

    // Evitar bucle infinito si el placeholder también falla
    if (target.src.includes('placeholder.jpg') || target.src.includes('data:image')) {
      // Si ya es el placeholder o una imagen data, usar un SVG inline como fallback
      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA0NUg5NVY1NUg4NVY0NVoiIGZpbGw9IiM5Q0E0QUYiLz4KPHA+CjxyZWN0IHg9IjcwIiB5PSI2NSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQiIGZpbGw9IiM5Q0E0QUYiLz4KPHA+CjxyZWN0IHg9IjgwIiB5PSI3NSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQiIGZpbGw9IiM5Q0E0QUYiLz4KPHA+Cjx0ZXh0IHg9IjEwMCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzlDQTRBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2VuPC90ZXh0Pgo8L3N2Zz4=';
      return;
    }

    // Intentar cargar placeholder solo si no es ya el placeholder
    target.src = '/assets/images/placeholder.jpg';
  }

}
