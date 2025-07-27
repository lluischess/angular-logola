import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BackofficeLayoutComponent } from '../backoffice-layout/backoffice-layout.component';

interface CategoriaCompleta {
  id?: number;
  nombre: string;
  esNovedades: boolean;
  publicada: boolean;
  // SEO
  metaTitulo: string;
  metaDescripcion: string;
  palabrasClave: string;
  urlSlug: string;
}

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
  categoriaId: number | null = null;
  activeTab = 'general';

  // Mock data para testing
  mockCategoria: CategoriaCompleta = {
    id: 1,
    nombre: 'Chocolates Premium',
    esNovedades: false,
    publicada: true,
    metaTitulo: 'Chocolates Premium - Logolate',
    metaDescripcion: 'Descubre nuestra selección de chocolates premium artesanales',
    palabrasClave: 'chocolates, premium, artesanales, cacao',
    urlSlug: 'chocolates-premium'
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Inicializar el formulario inmediatamente
    this.categoriaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      esNovedades: [false],
      publicada: [true],
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
        this.categoriaId = +params['id'];
        this.loadCategoria(this.categoriaId);
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



  private loadCategoria(id: number): void {
    // En un caso real, aquí cargarías los datos desde el servicio
    // Por ahora usamos datos mock
    this.categoriaForm.patchValue(this.mockCategoria);
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

  onSubmit(): void {
    if (this.categoriaForm.valid) {
      const categoriaData = this.categoriaForm.value;
      
      if (this.isEditMode) {
        console.log('Actualizando categoría:', categoriaData);
        // Aquí iría la lógica para actualizar
      } else {
        console.log('Creando nueva categoría:', categoriaData);
        // Aquí iría la lógica para crear
      }
      
      // Redirigir a la lista de categorías
      this.router.navigate(['/logoadmin/categorias']);
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
}
