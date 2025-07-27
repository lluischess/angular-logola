import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BackofficeLayoutComponent } from '../backoffice-layout/backoffice-layout.component';

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
  productoId: number | null = null;
  
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
    private authService: AuthService
  ) {
    this.initForm();
  }

  ngOnInit() {
    // Verificar si estamos en modo edición
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.productoId = +params['id'];
        this.loadProducto(this.productoId);
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

  private loadProducto(id: number) {
    // Aquí cargarías el producto desde el servicio
    // Por ahora, simulamos con datos mock
    const mockProducto: ProductoCompleto = {
      id: id,
      nombre: 'Producto de ejemplo',
      referencia: 'PROD-001',
      descripcion: 'Descripción detallada del producto',
      talla: 'mediano',
      categoria: 'chocolates',
      medidas: '10x10x5 cm',
      imagenes: ['imagen1.jpg', 'imagen2.jpg'],
      ingredientes: 'Chocolate, azúcar, leche',
      masDetalles: 'Detalles adicionales del producto',
      minimoUnidades: 25,
      consumePreferente: '12 meses',
      publicado: true,
      ordenCategoria: 1,
      metaTitle: 'Producto de ejemplo - Logolate',
      metaDescription: 'Descripción SEO del producto',
      metaKeywords: 'chocolate, dulce, regalo',
      urlSlug: 'producto-de-ejemplo'
    };

    this.productoForm.patchValue(mockProducto);
  }

  setActiveTab(tab: 'general' | 'seo') {
    this.activeTab = tab;
  }

  onImageUpload(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      // Aquí implementarías la lógica de subida de imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const imagenes = this.productoForm.get('imagenes')?.value || [];
        imagenes[index] = e.target.result;
        this.productoForm.patchValue({ imagenes });
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number) {
    const imagenes = this.productoForm.get('imagenes')?.value || [];
    imagenes.splice(index, 1);
    this.productoForm.patchValue({ imagenes });
  }

  getImagenes(): string[] {
    return this.productoForm.get('imagenes')?.value || [];
  }

  onSubmit() {
    if (this.productoForm.valid) {
      const formData = this.productoForm.value;
      
      if (this.isEditMode) {
        // Actualizar producto existente
        console.log('Actualizando producto:', formData);
        // Aquí llamarías al servicio para actualizar
      } else {
        // Crear nuevo producto
        console.log('Creando nuevo producto:', formData);
        // Aquí llamarías al servicio para crear
      }
      
      // Redirigir a la lista de productos
      this.router.navigate(['/logoadmin/productos']);
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

}
