import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ProductsService } from '../../services/products.service';
import { BackofficeLayoutComponent } from '../backoffice-layout/backoffice-layout.component';

interface Producto {
  id?: number;
  _id?: string;
  numeroProducto?: number;
  referencia: string;
  nombre: string;
  categoria: string;
  cantidadMinima: number;
  imagen?: string;
  fechaCreacion?: Date;
  publicado: boolean;
  orden: number;
  medidas?: string;
  descripcion?: string;
  precio?: number;
}

interface ProductStats {
  total: number;
  publicados: number;
  noPublicados: number;
  porCategoria: { [categoria: string]: number };
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, BackofficeLayoutComponent],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  filteredProductos: Producto[] = [];
  stats: ProductStats | null = null;
  isLoading = true;
  error: string | null = null;

  // Filtros
  filtroId: string = '';
  filtroReferencia: string = '';
  filtroCategoria: string = '';
  filtroCantidadMinima: string = '';
  filtroPublicado: string = '';
  filtroOrden: string = '';

  // Ordenamiento - por defecto por categoría
  sortColumn: string = 'categoria';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Arrow buttons for reordering
  reorderingProduct: Producto | null = null;
  showReorderFeedback: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private productsService: ProductsService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadStats();
  }

  /**
   * Cargar lista de productos desde el backend
   */
  loadProducts(): void {
    //console.log('🔄 Iniciando carga de productos...');
    this.isLoading = true;
    this.error = null;

    this.productsService.getProducts({
      sortBy: 'categoria',
      sortOrder: 'asc',
      limit: 1000
    }).subscribe({
      next: (response) => {
        //console.log('✅ Respuesta del backend para productos:', response);

        // Adaptar la respuesta del backend
        let productos: any[] = [];
        if (response && typeof response === 'object') {
          if ('products' in response && Array.isArray((response as any).products)) {
            productos = (response as any).products;
          } else if ('data' in response && Array.isArray((response as any).data)) {
            productos = (response as any).data;
          } else if (Array.isArray(response)) {
            productos = response as any[];
          }
        }

        // Convertir productos del backend al formato del componente
        this.productos = productos.map(product => ({
          _id: product._id,
          id: product._id, // Para compatibilidad temporal
          referencia: product.referencia || '',
          nombre: product.nombre || '',
          categoria: product.categoria || '',
          cantidadMinima: product.cantidadMinima || 0,
          imagen: product.imagen,
          fechaCreacion: product.fechaCreacion ? new Date(product.fechaCreacion) : undefined,
          publicado: product.publicado || false,
          orden: product.orden || 1,
          medidas: product.medidas,
          descripcion: product.descripcion,
          precio: product.precio
        }));

        //console.log('📈 Cantidad de productos cargados:', this.productos.length);
        //console.log('🎯 Productos asignados al componente:', this.productos);

        // Aplicar ordenamiento y filtros
        this.sortData();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando productos:', error);
        console.error('🔍 Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });

        this.error = 'Error al cargar los productos. Por favor, intenta de nuevo.';
        this.productos = [];
        this.filteredProductos = [];
        this.isLoading = false;
      }
    });
  }

  /**
   * Cargar estadísticas de productos
   */
  private loadStats(): void {
    //console.log('📊 Iniciando carga de estadísticas de productos...');

    this.productsService.getStats().subscribe({
      next: (stats) => {
        //console.log('✅ Respuesta del backend para estadísticas de productos:', stats);
        this.stats = stats;
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas de productos:', error);

        // Calcular estadísticas desde los productos cargados como fallback
        if (this.productos && this.productos.length > 0) {
          const total = this.productos.length;
          const publicados = this.productos.filter(p => p.publicado).length;
          const noPublicados = total - publicados;

          // Contar por categoría
          const porCategoria: { [categoria: string]: number } = {};
          this.productos.forEach(p => {
            porCategoria[p.categoria] = (porCategoria[p.categoria] || 0) + 1;
          });

          this.stats = {
            total,
            publicados,
            noPublicados,
            porCategoria
          };
          //console.log('🔄 Estadísticas calculadas como fallback:', this.stats);
        }
      }
    });
  }

  applyFilters() {
    this.filteredProductos = this.productos.filter(producto => {
      return (
        (this.filtroId === '' || producto.id?.toString().includes(this.filtroId)) &&
        (this.filtroReferencia === '' || producto.referencia.toLowerCase().includes(this.filtroReferencia.toLowerCase())) &&
        (this.filtroCategoria === '' || producto.categoria.toLowerCase().includes(this.filtroCategoria.toLowerCase())) &&
        (this.filtroCantidadMinima === '' || producto.cantidadMinima.toString().includes(this.filtroCantidadMinima)) &&
        (this.filtroPublicado === '' ||
          (this.filtroPublicado === 'si' && producto.publicado) ||
          (this.filtroPublicado === 'no' && !producto.publicado) ||
          this.filtroPublicado === 'todos') &&
        (this.filtroOrden === '' || producto.orden.toString().includes(this.filtroOrden))
      );
    });
    this.sortFilteredData();
  }

  clearFilters() {
    this.filtroId = '';
    this.filtroReferencia = '';
    this.filtroCategoria = '';
    this.filtroCantidadMinima = '';
    this.filtroPublicado = '';
    this.filtroOrden = '';
    this.applyFilters();
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortData();
    this.applyFilters();
  }

  private sortData() {
    this.productos.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'referencia':
          aValue = a.referencia.toLowerCase();
          bValue = b.referencia.toLowerCase();
          break;
        case 'categoria':
          aValue = a.categoria.toLowerCase();
          bValue = b.categoria.toLowerCase();
          break;
        case 'cantidadMinima':
          aValue = a.cantidadMinima;
          bValue = b.cantidadMinima;
          break;
        case 'fechaCreacion':
          aValue = a.fechaCreacion ? a.fechaCreacion.getTime() : 0;
          bValue = b.fechaCreacion ? b.fechaCreacion.getTime() : 0;
          break;
        case 'publicado':
          aValue = a.publicado ? 1 : 0;
          bValue = b.publicado ? 1 : 0;
          break;
        case 'orden':
          aValue = a.orden;
          bValue = b.orden;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      } else if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });
  }

  private sortFilteredData() {
    this.filteredProductos.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'referencia':
          aValue = a.referencia.toLowerCase();
          bValue = b.referencia.toLowerCase();
          break;
        case 'categoria':
          aValue = a.categoria.toLowerCase();
          bValue = b.categoria.toLowerCase();
          break;
        case 'cantidadMinima':
          aValue = a.cantidadMinima;
          bValue = b.cantidadMinima;
          break;
        case 'fechaCreacion':
          aValue = a.fechaCreacion ? a.fechaCreacion.getTime() : 0;
          bValue = b.fechaCreacion ? b.fechaCreacion.getTime() : 0;
          break;
        case 'publicado':
          aValue = a.publicado ? 1 : 0;
          bValue = b.publicado ? 1 : 0;
          break;
        case 'orden':
          aValue = a.orden;
          bValue = b.orden;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      } else if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });
  }

  editProduct(producto: Producto) {
    const productId = producto._id || producto.id;
    if (productId) {
      this.router.navigate(['/logoadmin/productos/editar', productId]);
    }
  }

  deleteProduct(producto: Producto) {
    if (confirm(`¿Estás seguro de que quieres eliminar el producto "${producto.nombre}"?`)) {
      const productId = producto._id || producto.id?.toString();
      if (productId) {
        this.productsService.deleteProduct(productId).subscribe({
          next: () => {
            //console.log('✅ Producto eliminado correctamente');
            this.loadProducts(); // Recargar la lista
          },
          error: (error) => {
            console.error('❌ Error eliminando producto:', error);
            alert('Error al eliminar el producto. Por favor, intenta de nuevo.');
          }
        });
      }
    }
  }

  togglePublished(producto: Producto) {
    const productId = producto._id || producto.id?.toString();
    if (productId) {
      const updatedProduct = { ...producto, publicado: !producto.publicado };

      this.productsService.updateProduct(productId, updatedProduct).subscribe({
        next: () => {
          //console.log('✅ Estado de publicación actualizado');
          producto.publicado = !producto.publicado;
          this.applyFilters();
          this.loadStats(); // Actualizar estadísticas
        },
        error: (error) => {
          console.error('❌ Error actualizando estado de publicación:', error);
          alert('Error al actualizar el estado. Por favor, intenta de nuevo.');
        }
      });
    }
  }

  // Métodos para reordenamiento
  startReordering(producto: Producto) {
    this.reorderingProduct = producto;
    this.showReorderFeedback = true;
  }

  moveUp(producto: Producto) {
    const productId = producto._id || producto.id?.toString();
    if (productId) {
      this.productsService.reorderProduct(productId, 'up').subscribe({
        next: () => {
          //console.log('✅ Producto movido hacia arriba');
          this.loadProducts(); // Recargar para ver el nuevo orden
        },
        error: (error) => {
          console.error('❌ Error reordenando producto:', error);
          alert('Error al reordenar. Por favor, intenta de nuevo.');
        }
      });
    }
  }

  moveDown(producto: Producto) {
    const productId = producto._id || producto.id?.toString();
    if (productId) {
      this.productsService.reorderProduct(productId, 'down').subscribe({
        next: () => {
          //console.log('✅ Producto movido hacia abajo');
          this.loadProducts(); // Recargar para ver el nuevo orden
        },
        error: (error) => {
          console.error('❌ Error reordenando producto:', error);
          alert('Error al reordenar. Por favor, intenta de nuevo.');
        }
      });
    }
  }

  stopReordering() {
    this.reorderingProduct = null;
    this.showReorderFeedback = false;
  }

  createProduct() {
    this.router.navigate(['/logoadmin/productos/crear']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/logoadmin/login']);
  }
}
