import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BackofficeLayoutComponent } from '../backoffice-layout/backoffice-layout.component';
import { ProductsService } from '../../services/products.service';

export interface ProductoCompleto {
  id?: number;
  nombre: string;
  referencia: string;
  descripcion: string;
  talla: 'grande' | 'mediano' | 'pequeño';
  categoria: string;
  medidas: string;
  imagenes: string[];
  ingredientes: string;
  masDetalles: string;
  minimoUnidades: number;
  consumePreferente: string;
  publicado: boolean;
  // Campos SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  urlSlug: string;
  // Campos adicionales
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
  ordenCategoria?: number;
}

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, BackofficeLayoutComponent],
  templateUrl: './producto-form.component.html',
  styleUrl: './producto-form.component.css'
})
export class ProductoFormComponent implements OnInit {
  productoForm!: FormGroup;
  activeTab: 'general' | 'seo' = 'general';
  isEditMode = false;
  productoId: string | null = null;
  
  // Opciones disponibles
  tallasDisponibles = [
    { value: 'grande', label: 'Grande' },
    { value: 'mediano', label: 'Mediano' },
    { value: 'pequeño', label: 'Pequeño' }
  ];
  
  categoriasDisponibles = [
    { value: 'chocolates', label: 'Chocolates' },
    { value: 'caramelos', label: 'Caramelos' },
    { value: 'novedades', label: 'Novedades' },
    { value: 'navidad', label: 'Navidad' },
    { value: 'galletas', label: 'Galletas' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private productsService: ProductsService
  ) {
    this.initForm();
  }

  ngOnInit() {
    // Verificar si estamos en modo edición
    this.route.params.subscribe(params => {
      if (params['id']) {
        const id = params['id'];
        // Validar que sea un ObjectId válido de MongoDB (24 caracteres hexadecimales)
        if (this.isValidObjectId(id)) {
          this.isEditMode = true;
          this.productoId = id;
          this.loadProducto(id);
        } else {
          console.error('❌ ID de producto inválido:', params['id']);
          alert('ID de producto inválido');
          this.router.navigate(['/logoadmin/productos']);
        }
      }
    });
  }

  /**
   * Validar si un string es un ObjectId válido de MongoDB
   */
  private isValidObjectId(id: string): boolean {
    // ObjectId de MongoDB: 24 caracteres hexadecimales
    return !!(id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id));
  }

  /**
   * Cargar datos del producto para edición
   */
  private loadProducto(id: string): void {
    this.productsService.getProduct(id).subscribe({
      next: (producto: any) => {
        console.log('✅ Producto cargado para edición:', producto);
        // Rellenar el formulario con los datos del producto
        this.productoForm.patchValue({
          nombre: producto.nombre || '',
          referencia: producto.referencia || '',
          descripcion: producto.descripcion || '',
          talla: producto.talla || '',
          categoria: producto.categoria || '',
          medidas: producto.medidas || '',
          imagenes: producto.imagenes || [],
          ingredientes: producto.ingredientes || '',
          masDetalles: producto.masDetalles || '',
          minimoUnidades: producto.cantidadMinima || 1,
          precio: producto.precio || null,
          consumePreferente: producto.consumePreferente || '',
          publicado: producto.publicado !== false,
          ordenCategoria: producto.ordenCategoria || 1,
          // SEO Fields
          metaTitle: producto.metaTitulo || '',
          metaDescription: producto.metaDescripcion || '',
          metaKeywords: producto.palabrasClave || '',
          urlSlug: producto.urlSlug || ''
        });
      },
      error: (error) => {
        console.error('❌ Error cargando producto:', error);
        alert('Error al cargar el producto');
        this.router.navigate(['/logoadmin/productos']);
      }
    });
  }

  private initForm() {
    this.productoForm = this.fb.group({
      // Campos generales
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      referencia: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      talla: ['mediano', Validators.required],
      categoria: ['', Validators.required],
      medidas: ['', [Validators.required, Validators.maxLength(100)]],
      imagenes: [[]],
      ingredientes: ['', [Validators.required, Validators.maxLength(500)]],
      masDetalles: ['', Validators.maxLength(1000)],
      minimoUnidades: [1, [Validators.required, Validators.min(1), Validators.max(10000)]],
      precio: [null, [Validators.min(0)]],
      consumePreferente: ['', [Validators.maxLength(50)]],
      publicado: [false],
      ordenCategoria: [{value: 1, disabled: true}],
      
      // Campos SEO
      metaTitle: ['', [Validators.maxLength(60)]],
      metaDescription: ['', [Validators.maxLength(160)]],
      metaKeywords: ['', [Validators.maxLength(200)]],
      urlSlug: ['', [Validators.maxLength(100)]]
    });

    // Auto-generar slug cuando cambie el nombre
    this.productoForm.get('nombre')?.valueChanges.subscribe(nombre => {
      if (nombre && !this.productoForm.get('urlSlug')?.value) {
        const slug = this.generateSlug(nombre);
        this.productoForm.patchValue({ urlSlug: slug });
      }
    });

    // Auto-completar meta title si está vacío
    this.productoForm.get('nombre')?.valueChanges.subscribe(nombre => {
      if (nombre && !this.productoForm.get('metaTitle')?.value) {
        this.productoForm.patchValue({ metaTitle: nombre });
      }
    });

    // Calcular orden automáticamente al seleccionar categoría
    this.productoForm.get('categoria')?.valueChanges.subscribe(categoria => {
      if (categoria && !this.isEditMode) {
        this.calculateOrderForCategory(categoria);
      }
    });
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Eliminar guiones duplicados
      .trim();
  }



  setActiveTab(tab: 'general' | 'seo') {
    this.activeTab = tab;
  }

  getImagenes(): string[] {
    return this.productoForm.get('imagenes')?.value || [];
  }

  onSubmit() {
    if (this.productoForm.valid) {
      const rawFormData = this.productoForm.value;
      
      // Mapear datos del formulario al formato esperado por el backend
      
      // Construir formData solo con campos que tienen valores válidos
      const formData: any = {
        nombre: rawFormData.nombre,
        referencia: rawFormData.referencia,
        descripcion: rawFormData.descripcion,
        talla: rawFormData.talla,
        categoria: rawFormData.categoria,
        medidas: rawFormData.medidas,
        imagenes: rawFormData.imagenes || [],
        ingredientes: rawFormData.ingredientes || 'No especificado',
        masDetalles: rawFormData.masDetalles,
        cantidadMinima: rawFormData.minimoUnidades || 1, // Mapear minimoUnidades → cantidadMinima
        precio: rawFormData.precio, // Añadir precio directamente
        publicado: rawFormData.publicado !== false, // Default true
        consumePreferente: rawFormData.consumePreferente,
        // SEO Fields - mapear nombres correctos
        metaTitulo: rawFormData.metaTitle,
        metaDescripcion: rawFormData.metaDescription,
        palabrasClave: rawFormData.metaKeywords,
        urlSlug: rawFormData.urlSlug
      };
      
      // Solo añadir ordenCategoria si tiene un valor válido (permitir cálculo automático si es undefined)
      if (rawFormData.ordenCategoria || rawFormData.orden) {
        formData.ordenCategoria = rawFormData.ordenCategoria || rawFormData.orden;
      }
      
      if (this.isEditMode) {
        // Validar que tenemos un ID válido antes de actualizar
        if (!this.productoId || !this.isValidObjectId(this.productoId)) {
          console.error('❌ Error: ID de producto inválido para actualización:', this.productoId);
          alert('Error: ID de producto inválido. No se puede actualizar.');
          return;
        }
        
        // Actualizar producto existente
        console.log('Actualizando producto con ID:', this.productoId, 'Datos:', formData);
        this.productsService.updateProduct(this.productoId.toString(), formData).subscribe({
          next: (response) => {
            console.log('✅ Producto actualizado exitosamente:', response);
            alert('Producto actualizado exitosamente');
            this.router.navigate(['/logoadmin/productos']);
          },
          error: (error) => {
            console.error('❌ Error actualizando producto:', error);
            alert('Error al actualizar el producto. Por favor, intenta de nuevo.');
          }
        });
      } else {
        // Crear nuevo producto
        console.log('Creando nuevo producto:', formData);
        this.productsService.createProduct(formData).subscribe({
          next: (response) => {
            console.log('✅ Producto creado exitosamente:', response);
            alert('Producto creado exitosamente');
            this.router.navigate(['/logoadmin/productos']);
          },
          error: (error) => {
            console.error('❌ Error creando producto:', error);
            alert('Error al crear el producto. Por favor, intenta de nuevo.');
          }
        });
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      this.markFormGroupTouched(this.productoForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.router.navigate(['/logoadmin/productos']);
  }

  // Métodos para validación
  isFieldInvalid(fieldName: string): boolean {
    const field = this.productoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.productoForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es obligatorio';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;
    }
    return '';
  }

  /**
   * Calcular automáticamente el orden para la categoría seleccionada
   */
  private calculateOrderForCategory(categoria: string): void {
    console.log(`📊 Calculando orden para categoría: ${categoria}`);
    
    this.productsService.getNextOrderForCategory(categoria).subscribe({
      next: (response) => {
        const nextOrder = response.nextOrder;
        console.log(`✅ Orden calculado: ${nextOrder}`);
        
        // Actualizar el campo orden en el formulario
        this.productoForm.patchValue({ 
          ordenCategoria: nextOrder 
        });
        
        // Habilitar temporalmente el campo para mostrar el valor
        const ordenControl = this.productoForm.get('ordenCategoria');
        if (ordenControl) {
          ordenControl.enable();
          setTimeout(() => {
            ordenControl.disable();
          }, 100);
        }
      },
      error: (error) => {
        console.error('❌ Error calculando orden:', error);
        // Fallback al orden 1
        this.productoForm.patchValue({ ordenCategoria: 1 });
      }
    });
  }

  /**
   * Manejar la subida de imagen
   */
  onImageUpload(event: any, index: number): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten archivos de imagen (JPG, PNG, WEBP)');
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('El archivo es demasiado grande. Máximo 5MB.');
      return;
    }

    console.log(`📷 Subiendo imagen ${index + 1}:`, file.name);

    // Subir imagen al servidor
    this.productsService.uploadProductImage(file).subscribe({
      next: (response) => {
        console.log('✅ Imagen subida exitosamente:', response.imagePath);
        
        // Actualizar el array de imágenes en el formulario
        const imagenes = this.getImagenes();
        imagenes[index] = response.imagePath;
        this.productoForm.patchValue({ imagenes });
      },
      error: (error) => {
        console.error('❌ Error subiendo imagen:', error);
        alert('Error al subir la imagen. Por favor, inténtalo de nuevo.');
      }
    });

    // Mostrar preview mientras se sube
    const reader = new FileReader();
    reader.onload = (e: any) => {
      // Crear un preview temporal
      const imagenes = this.getImagenes();
      imagenes[index] = e.target.result; // Base64 temporal
      this.productoForm.patchValue({ imagenes });
    };
    reader.readAsDataURL(file);
  }

  /**
   * Eliminar imagen
   */
  removeImage(index: number): void {
    const imagenes = this.getImagenes();
    const imagePath = imagenes[index];

    if (imagePath && !imagePath.startsWith('data:')) {
      // Si es una imagen del servidor (no un preview), eliminarla del servidor
      this.productsService.deleteProductImage(imagePath).subscribe({
        next: () => {
          console.log('✅ Imagen eliminada del servidor');
        },
        error: (error) => {
          console.error('❌ Error eliminando imagen del servidor:', error);
        }
      });
    }

    // Eliminar del formulario
    imagenes.splice(index, 1);
    this.productoForm.patchValue({ imagenes });
  }

  /**
   * Obtener URL completa de la imagen
   */
  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('data:')) return imagePath; // Base64 preview
    if (imagePath.startsWith('http')) return imagePath; // URL completa
    return `http://localhost:3000${imagePath}`; // Ruta relativa del servidor
  }

  /**
   * Verificar si hay una imagen en el índice especificado
   */
  hasImage(index: number): boolean {
    const imagenes = this.getImagenes();
    return !!(imagenes[index] && imagenes[index].length > 0);
  }

}
