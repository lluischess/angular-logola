import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BackofficeLayoutComponent } from '../backoffice-layout/backoffice-layout.component';
import { CategoriesService, Category } from '../../services/categories.service';

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, BackofficeLayoutComponent],
  templateUrl: './categoria-form.component.html',
  styleUrls: ['./categoria-form.component.css']
})
export class CategoriaFormComponent implements OnInit {
  categoriaForm: FormGroup;
  isEditMode = false;
  categoriaId: string | null = null;
  activeTab = 'general';
  isLoading = false;
  error: string | null = null;
  currentCategory: Category | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private categoriesService: CategoriesService
  ) {
    // Inicializar el formulario inmediatamente
    this.categoriaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(500)]],
      orden: [1, [Validators.required, Validators.min(1)]],
      publicado: [true],
      configuracionEspecial: [false],
      // SEO
      metaTitulo: ['', [Validators.maxLength(60)]],
      metaDescripcion: ['', [Validators.maxLength(160)]],
      palabrasClave: ['', [Validators.maxLength(200)]],
      urlSlug: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.categoriaId = params['id'];
        if (this.categoriaId) {
          this.loadCategoria(this.categoriaId);
        }
      } else {
        // Si es modo creación, cargar el próximo orden disponible
        this.loadNextAvailableOrder();
      }
    });

    // Auto-generar URL slug cuando cambie el nombre
    this.categoriaForm.get('nombre')?.valueChanges.subscribe(nombre => {
      if (nombre && !this.isEditMode) {
        const slug = this.generateSlug(nombre);
        this.categoriaForm.patchValue({ urlSlug: slug }, { emitEvent: false });

        // Auto-generar meta título
        const metaTitulo = `${nombre} - Logolate`;
        if (metaTitulo.length <= 60) {
          this.categoriaForm.patchValue({ metaTitulo }, { emitEvent: false });
        }
      }
    });
  }



  private loadCategoria(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.categoriesService.getCategory(id).subscribe({
      next: (category) => {
        this.currentCategory = category;
        this.categoriaForm.patchValue({
          nombre: category.nombre,
          descripcion: category.descripcion || '',
          orden: category.orden,
          publicado: category.publicado,
          configuracionEspecial: category.configuracionEspecial,
          metaTitulo: category.metaTitulo || '',
          metaDescripcion: category.metaDescripcion || '',
          palabrasClave: category.palabrasClave || '',
          urlSlug: category.urlSlug || ''
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando categoría:', error);
        this.error = 'Error al cargar la categoría. Por favor, intenta de nuevo.';
        this.isLoading = false;
      }
    });
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  async onSubmit(): Promise<void> {
    if (this.categoriaForm.valid) {
      this.isLoading = true;
      this.error = null;

      const categoriaData = this.categoriaForm.value;

      // Validaciones antes de enviar
      //console.log('🔍 Iniciando validaciones...');

      // 1. Validar nombre único
      const nombreUnico = await this.validateUniqueName(
        categoriaData.nombre || '',
        this.isEditMode ? this.categoriaId || undefined : undefined
      );

      if (!nombreUnico) {
        this.error = `Ya existe una categoría con el nombre "${categoriaData.nombre}". Por favor, elige un nombre diferente.`;
        this.isLoading = false;
        return;
      }

      // 2. Validar configuración especial única (solo si se está marcando como especial)
      if (categoriaData.configuracionEspecial) {
        const especialUnica = await this.validateUniqueSpecialConfig(
          this.isEditMode ? this.categoriaId || undefined : undefined
        );

        if (!especialUnica) {
          this.error = 'Ya existe una categoría marcada como "Configuración Especial". Solo puede haber una categoría especial. Desmarca la otra categoría especial primero.';
          this.isLoading = false;
          return;
        }
      }

      //console.log('✅ Todas las validaciones pasaron correctamente');

      // Auto-generar slug si no existe
      if (!categoriaData.urlSlug && categoriaData.nombre) {
        categoriaData.urlSlug = this.categoriesService.generateSlug(categoriaData.nombre);
      }

      if (this.isEditMode && this.categoriaId) {
        // Actualizar categoría existente
        this.categoriesService.updateCategory(this.categoriaId, categoriaData).subscribe({
          next: (updatedCategory) => {
            //console.log('Categoría actualizada correctamente:', updatedCategory);
            this.router.navigate(['/logoadmin/categorias']);
          },
          error: (error) => {
            console.error('Error actualizando categoría:', error);
            this.error = 'Error al actualizar la categoría. Por favor, intenta de nuevo.';
            this.isLoading = false;
          }
        });
      } else {
        // Crear nueva categoría
        //console.log('📤 Enviando datos de categoría al backend:', categoriaData);
        //console.log('🔍 Validez del formulario:', this.categoriaForm.valid);
        //console.log('🔍 Errores del formulario:', this.categoriaForm.errors);

        // Verificar cada campo individualmente
        Object.keys(this.categoriaForm.controls).forEach(key => {
          const control = this.categoriaForm.get(key);
          if (control && control.errors) {
            //console.log(`❌ Campo ${key} tiene errores:`, control.errors);
          } else {
            //console.log(`✅ Campo ${key} válido:`, control?.value);
          }
        });

        // Limpiar datos antes de enviar (eliminar campos vacíos)
        const cleanData = {
          nombre: categoriaData.nombre?.trim(),
          descripcion: categoriaData.descripcion?.trim() || undefined,
          orden: Number(categoriaData.orden) || 1,
          publicado: Boolean(categoriaData.publicado),
          configuracionEspecial: Boolean(categoriaData.configuracionEspecial),
          metaTitulo: categoriaData.metaTitulo?.trim() || undefined,
          metaDescripcion: categoriaData.metaDescripcion?.trim() || undefined,
          palabrasClave: categoriaData.palabrasClave?.trim() || undefined,
          urlSlug: categoriaData.urlSlug?.trim()
        };

        // Eliminar campos undefined
        Object.keys(cleanData).forEach(key => {
          if (cleanData[key as keyof typeof cleanData] === undefined) {
            delete cleanData[key as keyof typeof cleanData];
          }
        });

        //console.log('🧹 Datos limpios a enviar:', cleanData);

        this.categoriesService.createCategory(cleanData).subscribe({
          next: (newCategory) => {
            //console.log('✅ Categoría creada correctamente:', newCategory);
            this.router.navigate(['/logoadmin/categorias']);
          },
          error: (error) => {
            console.error('❌ Error completo creando categoría:', error);
            console.error('📋 Status:', error.status);
            console.error('📋 Message:', error.message);
            console.error('📋 Error body:', error.error);

            let errorMessage = 'Error al crear la categoría. Por favor, intenta de nuevo.';

            if (error.status === 400) {
              // Verificar si es un error de orden duplicado
              if (error.error?.message && error.error.message.includes('Ya existe una categoría con el orden:')) {
                const ordenConflicto = error.error.message.match(/orden: (\d+)/)?.[1];
                errorMessage = `Ya existe una categoría con el orden ${ordenConflicto}. El sistema calculará automáticamente el próximo orden disponible.`;

                // Recalcular el próximo orden disponible
                //console.log('🔄 Recalculando orden debido a conflicto...');
                setTimeout(() => {
                  this.loadNextAvailableOrder();
                  this.error = null; // Limpiar el error después de recalcular
                }, 2000);
              } else {
                errorMessage = 'Datos inválidos. Verifica que todos los campos requeridos estén completos.';
              }
            } else if (error.status === 401) {
              errorMessage = 'No tienes permisos para crear categorías. Inicia sesión de nuevo.';
            } else if (error.status === 409) {
              errorMessage = 'Ya existe una categoría con ese nombre o URL.';
            } else if (error.status === 0) {
              errorMessage = 'No se puede conectar con el servidor. Verifica que el backend esté funcionando.';
            }

            this.error = errorMessage;
            this.isLoading = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/logoadmin/categorias']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.categoriaForm.controls).forEach(key => {
      const control = this.categoriaForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para validación
  get nombre() { return this.categoriaForm.get('nombre'); }
  get metaTitulo() { return this.categoriaForm.get('metaTitulo'); }
  get metaDescripcion() { return this.categoriaForm.get('metaDescripcion'); }
  get palabrasClave() { return this.categoriaForm.get('palabrasClave'); }
  get urlSlug() { return this.categoriaForm.get('urlSlug'); }

  // Métodos para contadores de caracteres
  getCharacterCount(fieldName: string): number {
    const value = this.categoriaForm.get(fieldName)?.value || '';
    return value.length;
  }

  /**
   * Validar que el nombre de la categoría sea único
   */
  private validateUniqueName(nombre: string, excludeId?: string): Promise<boolean> {
    return new Promise((resolve) => {
      //console.log('🔍 Validando nombre único:', nombre);

      this.categoriesService.getCategories({
        search: nombre,
        limit: 100
      }).subscribe({
        next: (response) => {
          let categorias: any[] = [];
          if (response && typeof response === 'object') {
            if ('categories' in response && Array.isArray((response as any).categories)) {
              categorias = (response as any).categories;
            } else if ('data' in response && Array.isArray((response as any).data)) {
              categorias = (response as any).data;
            }
          }

          // Verificar si existe una categoría con el mismo nombre (excluyendo la actual si es edición)
          const existeNombre = categorias.some(cat =>
            cat.nombre.toLowerCase() === nombre.toLowerCase() &&
            (!excludeId || cat._id !== excludeId)
          );

          //console.log('🔍 Existe nombre duplicado:', existeNombre);
          resolve(!existeNombre); // Retorna true si es único
        },
        error: (error) => {
          console.error('❌ Error validando nombre único:', error);
          resolve(true); // En caso de error, permitir continuar
        }
      });
    });
  }

  /**
   * Validar que solo haya una categoría con configuración especial
   */
  private validateUniqueSpecialConfig(excludeId?: string): Promise<boolean> {
    return new Promise((resolve) => {
      //console.log('🎆 Validando configuración especial única...');

      this.categoriesService.getCategories({
        limit: 100
      }).subscribe({
        next: (response) => {
          let categorias: any[] = [];
          if (response && typeof response === 'object') {
            if ('categories' in response && Array.isArray((response as any).categories)) {
              categorias = (response as any).categories;
            } else if ('data' in response && Array.isArray((response as any).data)) {
              categorias = (response as any).data;
            }
          }

          // Verificar si ya existe una categoría con configuración especial (excluyendo la actual)
          const existeEspecial = categorias.some(cat =>
            cat.configuracionEspecial === true &&
            (!excludeId || cat._id !== excludeId)
          );

          //console.log('🔍 Existe categoría especial:', existeEspecial);
          resolve(!existeEspecial); // Retorna true si no existe otra especial
        },
        error: (error) => {
          console.error('❌ Error validando configuración especial:', error);
          resolve(true); // En caso de error, permitir continuar
        }
      });
    });
  }

  /**
   * Cargar el próximo orden disponible para nuevas categorías
   */
  private loadNextAvailableOrder(): void {
    //console.log('🔢 Calculando próximo orden disponible...');

    this.categoriesService.getCategories({
      sortBy: 'orden',
      sortOrder: 'desc',
      limit: 1
    }).subscribe({
      next: (response) => {
        //console.log('✅ Respuesta para calcular orden:', response);

        let nextOrder = 1; // Orden por defecto

        // Adaptar la respuesta del backend
        let categorias: any[] = [];
        if (response && typeof response === 'object') {
          if ('categories' in response && Array.isArray((response as any).categories)) {
            categorias = (response as any).categories;
          } else if ('data' in response && Array.isArray((response as any).data)) {
            categorias = (response as any).data;
          } else if (Array.isArray(response)) {
            categorias = response as any[];
          }
        }

        // Calcular el próximo orden disponible
        if (categorias && categorias.length > 0) {
          const maxOrder = Math.max(...categorias.map(cat => cat.orden || 0));
          nextOrder = maxOrder + 1;
          //console.log('📈 Máximo orden encontrado:', maxOrder, '- Próximo orden:', nextOrder);
        } else {
          //console.log('🎆 No hay categorías existentes, usando orden 1');
        }

        // Actualizar el formulario con el nuevo orden
        this.categoriaForm.patchValue({ orden: nextOrder });
        //console.log('🎯 Orden asignado al formulario:', nextOrder);
      },
      error: (error) => {
        console.error('❌ Error calculando próximo orden:', error);
        // En caso de error, usar orden 1 como fallback
        //console.log('🔄 Usando orden 1 como fallback');
        this.categoriaForm.patchValue({ orden: 1 });
      }
    });
  }
}
