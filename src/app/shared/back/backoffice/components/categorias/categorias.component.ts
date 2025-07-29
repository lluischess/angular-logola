import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BackofficeLayoutComponent } from '../backoffice-layout/backoffice-layout.component';
import { CategoriesService, Category, CategoryStats } from '../../services/categories.service';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, BackofficeLayoutComponent],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.css'
})
export class CategoriasComponent implements OnInit {
  categorias: Category[] = [];
  stats: CategoryStats | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private categoriesService: CategoriesService
  ) {}

  ngOnInit(): void {
    this.loadCategorias();
    // Las estadísticas se cargan después de las categorías en loadCategorias()
  }

  /**
   * Cargar lista de categorías desde el backend
   */
  loadCategorias(): void {
    console.log('🔄 Iniciando carga de categorías...');
    this.isLoading = true;
    this.error = null;

    this.categoriesService.getCategories({
      sortBy: 'orden',
      sortOrder: 'asc'
    }).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del backend para categorías:', response);

        // El backend devuelve {categories: [...]} pero esperamos {data: [...]}
        // Vamos a adaptar la respuesta
        let categorias: Category[] = [];

        if (response && typeof response === 'object') {
          // Si la respuesta tiene la propiedad 'categories' (formato actual del backend)
          if ('categories' in response && Array.isArray((response as any).categories)) {
            categorias = (response as any).categories;
            console.log('📊 Datos de categorías desde response.categories:', categorias);
          }
          // Si la respuesta tiene la propiedad 'data' (formato esperado)
          else if ('data' in response && Array.isArray((response as any).data)) {
            categorias = (response as any).data;
            console.log('📊 Datos de categorías desde response.data:', categorias);
          }
          // Si la respuesta es directamente un array
          else if (Array.isArray(response)) {
            categorias = response as Category[];
            console.log('📊 Datos de categorías como array directo:', categorias);
          }
        }

        console.log('📈 Cantidad de categorías procesadas:', categorias.length);

        this.categorias = categorias;
        this.isLoading = false;

        console.log('🎯 Categorías asignadas al componente:', this.categorias);

        // Cargar estadísticas después de tener las categorías
        this.loadStats();
      },
      error: (error) => {
        console.error('❌ Error cargando categorías:', error);
        console.error('🔍 Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });

        this.error = 'Error al cargar las categorías. Por favor, intenta de nuevo.';
        this.categorias = [];
        this.isLoading = false;
      }
    });
  }

  /**
   * Cargar estadísticas de categorías
   */
  private loadStats(): void {
    console.log('📊 Iniciando carga de estadísticas de categorías...');

    this.categoriesService.getStats().subscribe({
      next: (stats) => {
        console.log('✅ Respuesta del backend para estadísticas:', stats);
        console.log('🔍 Tipo de respuesta:', typeof stats);
        console.log('🔍 Propiedades de la respuesta:', Object.keys(stats || {}));

        // Adaptar la respuesta del backend si es necesario
        let processedStats: CategoryStats | null = null;

        if (stats && typeof stats === 'object') {
          // Si la respuesta tiene las propiedades esperadas directamente
          if ('total' in stats && 'publicadas' in stats) {
            processedStats = stats as CategoryStats;
            console.log('📈 Estadísticas procesadas (formato directo):', processedStats);
          }
          // Si la respuesta está anidada en otra propiedad
          else if ('stats' in stats) {
            processedStats = (stats as any).stats as CategoryStats;
            console.log('📈 Estadísticas procesadas (formato anidado):', processedStats);
          }
          // Si necesitamos calcular las estadísticas desde las categorías
          else {
            console.log('⚠️ Formato de estadísticas no reconocido, calculando desde categorías...');
            if (this.categorias && this.categorias.length > 0) {
              const total = this.categorias.length;
              const publicadas = this.categorias.filter(cat => cat.publicado).length;
              const noPublicadas = total - publicadas;
              const configuracionEspecial = this.categorias.filter(cat => cat.configuracionEspecial).length;

              processedStats = {
                total,
                publicadas,
                noPublicadas,
                configuracionEspecial
              };
              console.log('📈 Estadísticas calculadas manualmente:', processedStats);
            }
          }
        }

        this.stats = processedStats;
        console.log('🎯 Estadísticas asignadas al componente:', this.stats);
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas:', error);
        console.error('🔍 Detalles del error de estadísticas:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });

        // Si hay error, calcular estadísticas desde las categorías cargadas
        if (this.categorias && this.categorias.length > 0) {
          const total = this.categorias.length;
          const publicadas = this.categorias.filter(cat => cat.publicado).length;
          const noPublicadas = total - publicadas;
          const configuracionEspecial = this.categorias.filter(cat => cat.configuracionEspecial).length;

          this.stats = {
            total,
            publicadas,
            noPublicadas,
            configuracionEspecial
          };
          console.log('🔄 Estadísticas calculadas como fallback:', this.stats);
        }
      }
    });
  }

  /**
   * Alternar estado de publicación de una categoría
   */
  togglePublicacion(categoria: Category): void {
    if (!categoria._id) return;

    const newStatus = !categoria.publicado;

    this.categoriesService.updateCategory(categoria._id, { publicado: newStatus }).subscribe({
      next: (updatedCategory) => {
        categoria.publicado = updatedCategory.publicado;
        console.log(`Categoría "${categoria.nombre}" ${categoria.publicado ? 'publicada' : 'despublicada'}`);
      },
      error: (error) => {
        console.error('Error actualizando categoría:', error);
        // Revertir el cambio en caso de error
        categoria.publicado = !newStatus;
      }
    });
  }

  /**
   * Obtener clase CSS para el estado de publicación
   */
  getEstadoClass(publicado: boolean): string {
    return publicado ? 'badge-success' : 'badge-warning';
  }

  /**
   * Obtener texto del estado de publicación
   */
  getEstadoTexto(publicado: boolean): string {
    return publicado ? 'Publicada' : 'Borrador';
  }

  /**
   * Obtener número de categorías publicadas
   */
  getCategoriasPublicadas(): number {
    if (this.stats) {
      return this.stats.publicadas;
    }
    return this.categorias.filter(cat => cat.publicado).length;
  }

  /**
   * Obtener total de productos en todas las categorías
   */
  getTotalProductos(): number {
    return this.categorias.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
  }

  /**
   * Navegar a crear nueva categoría
   */
  createCategoria(): void {
    this.router.navigate(['/logoadmin/categorias/nueva']);
  }

  /**
   * Navegar a editar categoría
   */
  editCategoria(id: string): void {
    this.router.navigate(['/logoadmin/categorias/editar', id]);
  }

  /**
   * Eliminar categoría
   */
  deleteCategoria(categoria: Category): void {
    if (!categoria._id) return;

    if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?`)) {
      this.categoriesService.deleteCategory(categoria._id).subscribe({
        next: () => {
          console.log(`Categoría "${categoria.nombre}" eliminada correctamente`);
          this.loadCategorias(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error eliminando categoría:', error);
          alert('Error al eliminar la categoría. Por favor, intenta de nuevo.');
        }
      });
    }
  }
}
