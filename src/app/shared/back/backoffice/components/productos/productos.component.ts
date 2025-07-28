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
  imagenes?: string[]; // Array de imágenes del producto
  fechaCreacion?: Date;
  publicado: boolean;
  orden: number;
  ordenCategoria?: number; // Campo del backend
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
    console.log('🔄 Iniciando carga de productos...');
    this.isLoading = true;
    this.error = null;
    
    this.productsService.getProducts({
      sortBy: 'categoria',
      sortOrder: 'asc',
      limit: 100
    }).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del backend para productos:', response);
        
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
          numeroProducto: product.numeroProducto, // Campo autonumérico
          referencia: product.referencia || '',
          nombre: product.nombre || '',
          categoria: product.categoria || '',
          cantidadMinima: product.cantidadMinima || 0,
          imagen: product.imagen,
          fechaCreacion: product.fechaCreacion ? new Date(product.fechaCreacion) : undefined,
          publicado: product.publicado || false,
          orden: product.ordenCategoria || product.orden || 1, // Usar ordenCategoria del backend
          ordenCategoria: product.ordenCategoria || product.orden || 1, // Campo específico del backend
          medidas: product.medidas,
          descripcion: product.descripcion,
          precio: product.precio
        } as any));
        
        console.log('📈 Cantidad de productos cargados:', this.productos.length);
        console.log('🎯 Productos asignados al componente:', this.productos);
        
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
    console.log('📊 Iniciando carga de estadísticas de productos...');
    
    this.productsService.getStats().subscribe({
      next: (stats) => {
        console.log('✅ Respuesta del backend para estadísticas de productos:', stats);
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
          console.log('🔄 Estadísticas calculadas como fallback:', this.stats);
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
        case 'numeroProducto':
          aValue = a.numeroProducto || 0;
          bValue = b.numeroProducto || 0;
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
        case 'numeroProducto':
          aValue = a.numeroProducto || 0;
          bValue = b.numeroProducto || 0;
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
            console.log('✅ Producto eliminado correctamente');
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
          console.log('✅ Estado de publicación actualizado');
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
    if (!productId) {
      alert('Error: No se pudo identificar el producto.');
      return;
    }

    // Usar ordenCategoria que es el campo correcto en la base de datos
    const currentOrder = (producto as any).ordenCategoria || producto.orden || 1;
    const newOrder = currentOrder - 1;
    
    // Validar si el movimiento es posible
    if (newOrder < 1) {
      alert('No se puede mover el producto más arriba. Ya está en la primera posición (orden 1).');
      return;
    }
    
    // Aplicar efecto visual
    this.applyReorderEffect(producto);
    
    console.log(`🔄 Moviendo producto hacia arriba: ${currentOrder} -> ${newOrder}`);
    
    this.productsService.updateProductOrder(productId, newOrder).subscribe({
      next: () => {
        console.log('✅ Producto movido hacia arriba');
        this.loadProducts(); // Recargar para ver el nuevo orden
      },
      error: (error) => {
        console.error('❌ Error reordenando producto:', error);
        this.stopReordering(); // Quitar efecto visual en caso de error
        let errorMessage = 'Error al reordenar el producto.';
        
        if (error.status === 400) {
          errorMessage = 'Error: El orden especificado no es válido. El orden debe ser un número positivo mayor a 0.';
        } else if (error.status === 404) {
          errorMessage = 'Error: No se encontró el producto especificado.';
        } else if (error.status === 409) {
          errorMessage = 'Error: Ya existe otro producto con ese orden en la misma categoría.';
        } else if (error.error?.message) {
          errorMessage = `Error: ${error.error.message}`;
        }
        
        alert(errorMessage);
      }
    });
  }

  moveDown(producto: Producto) {
    const productId = producto._id || producto.id?.toString();
    if (!productId) {
      alert('Error: No se pudo identificar el producto.');
      return;
    }

    // Usar ordenCategoria que es el campo correcto en la base de datos
    const currentOrder = (producto as any).ordenCategoria || producto.orden || 1;
    const newOrder = currentOrder + 1;
    
    // Obtener el máximo orden en la misma categoría para validar límites
    const productosEnCategoria = this.filteredProductos.filter((p: any) => 
      (p.categoria || p.categoria) === ((producto as any).categoria || producto.categoria)
    );
    const maxOrder = Math.max(...productosEnCategoria.map((p: any) => p.ordenCategoria || p.orden || 1));
    
    // Validar si el movimiento es posible
    if (newOrder > maxOrder + 1) {
      alert('No se puede mover el producto más abajo. Ya está en la última posición de su categoría.');
      return;
    }
    
    // Aplicar efecto visual
    this.applyReorderEffect(producto);
    
    console.log(`🔄 Moviendo producto hacia abajo: ${currentOrder} -> ${newOrder}`);
    
    this.productsService.updateProductOrder(productId, newOrder).subscribe({
      next: () => {
        console.log('✅ Producto movido hacia abajo');
        this.loadProducts(); // Recargar para ver el nuevo orden
      },
      error: (error) => {
        console.error('❌ Error reordenando producto:', error);
        this.stopReordering(); // Quitar efecto visual en caso de error
        let errorMessage = 'Error al reordenar el producto.';
        
        if (error.status === 400) {
          errorMessage = 'Error: El orden especificado no es válido. El orden debe ser un número positivo.';
        } else if (error.status === 404) {
          errorMessage = 'Error: No se encontró el producto especificado.';
        } else if (error.status === 409) {
          errorMessage = 'Error: Ya existe otro producto con ese orden en la misma categoría.';
        } else if (error.error?.message) {
          errorMessage = `Error: ${error.error.message}`;
        }
        
        alert(errorMessage);
      }
    });
  }

  stopReordering() {
    this.reorderingProduct = null;
    this.showReorderFeedback = false;
  }

  /**
   * Determinar si se puede mostrar la flecha hacia arriba
   */
  canMoveUp(producto: Producto): boolean {
    const currentOrder = (producto as any).ordenCategoria || producto.orden || 1;
    return currentOrder > 1;
  }

  /**
   * Determinar si se puede mostrar la flecha hacia abajo
   */
  canMoveDown(producto: Producto): boolean {
    // Obtener productos de la misma categoría
    const productosEnCategoria = this.filteredProductos.filter((p: any) => 
      (p.categoria || p.categoria) === ((producto as any).categoria || producto.categoria)
    );
    
    if (productosEnCategoria.length === 0) return false;
    
    // Obtener el máximo orden en la categoría
    const maxOrder = Math.max(...productosEnCategoria.map((p: any) => p.ordenCategoria || p.orden || 1));
    const currentOrder = (producto as any).ordenCategoria || producto.orden || 1;
    
    return currentOrder < maxOrder;
  }

  /**
   * Aplicar efecto visual al producto que se está reordenando
   */
  applyReorderEffect(producto: Producto): void {
    this.reorderingProduct = producto;
    this.showReorderFeedback = true;
    
    // Quitar el efecto después de 2 segundos
    setTimeout(() => {
      this.stopReordering();
    }, 2000);
  }

  /**
   * Verificar si un producto está siendo reordenado (para aplicar clase CSS)
   */
  isBeingReordered(producto: Producto): boolean {
    return this.reorderingProduct?._id === producto._id || this.reorderingProduct?.id === producto.id;
  }

  createProduct() {
    this.router.navigate(['/logoadmin/productos/nuevo']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/logoadmin/login']);
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return '↕️'; // Flecha bidireccional para columnas no ordenadas
    }
    return this.sortDirection === 'asc' ? '↑' : '↓'; // Flechas simples para dirección de ordenamiento
  }

  getPublicadoClass(publicado: boolean): string {
    return publicado ? 'badge bg-success' : 'badge bg-secondary';
  }

  getCategoriaClass(categoria: string): string {
    const colors = {
      'chocolates': 'badge bg-primary',
      'caramelos': 'badge bg-warning',
      'galletas': 'badge bg-info',
      'navidad': 'badge bg-danger',
      'otros': 'badge bg-secondary'
    };
    return colors[categoria as keyof typeof colors] || 'badge bg-secondary';
  }

  getArrowColorClass(categoria: string): string {
    const colors = {
      'chocolates': 'arrow-primary',
      'caramelos': 'arrow-warning',
      'galletas': 'arrow-info',
      'navidad': 'arrow-danger',
      'otros': 'arrow-secondary'
    };
    return colors[categoria as keyof typeof colors] || 'arrow-secondary';
  }

  trackByFn(index: number, item: Producto): any {
    return item._id || item.id || index;
  }

  /**
   * Verificar si un producto tiene imagen
   */
  hasProductImage(producto: Producto): boolean {
    return !!(producto.imagenes && producto.imagenes.length > 0 && producto.imagenes[0]);
  }

  /**
   * Obtener la URL de la primera imagen del producto
   */
  getProductImageUrl(producto: Producto): string {
    if (!producto.imagenes || producto.imagenes.length === 0) {
      return '';
    }
    
    const imagePath = producto.imagenes[0];
    if (!imagePath) return '';
    
    // Si ya es una URL completa, devolverla tal como está
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Construir URL completa para imágenes del servidor
    return `http://localhost:3000${imagePath}`;
  }

  /**
   * Manejar errores de carga de imagen
   */
  onImageError(event: any): void {
    console.warn('Error cargando imagen:', event.target.src);
    // Opcional: reemplazar con imagen por defecto
    // event.target.src = '/assets/images/no-image.png';
  }
}
