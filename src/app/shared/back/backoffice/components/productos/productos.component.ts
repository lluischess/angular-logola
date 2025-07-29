import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ProductsService } from '../../services/products.service';
import { BackofficeLayoutComponent } from '../backoffice-layout/backoffice-layout.component';

interface Producto {
  _id?: string;
  id?: string | number;
  numeroProducto?: number;
  referencia: string;
  nombre: string;
  categoria: string;
  cantidadMinima: number;
  imagenes?: string[];
  fechaCreacion: Date;
  publicado: boolean;
  orden: number;
  ordenCategoria?: number;
  medidas?: any;
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
  filtroReferencia: string = '';
  filtroCategoria: string = '';
  filtroCantidadMinima: string = '';
  filtroPublicado: string = '';
  filtroOrden: string = '';

  // Ordenamiento
  sortColumn: string = 'categoria';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Reordering
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

  loadProducts(): void {
    this.isLoading = true;
    this.error = null;
    
    this.productsService.getProducts({
      sortBy: 'categoria',
      sortOrder: 'asc',
      limit: 100
    }).subscribe({
      next: (response: any) => {
        let productos: any[] = [];
        if (response && typeof response === 'object') {
          if ('products' in response && Array.isArray(response.products)) {
            productos = response.products;
          } else if ('data' in response && Array.isArray(response.data)) {
            productos = response.data;
          } else if (Array.isArray(response)) {
            productos = response;
          }
        }
        
        // Debug: Log raw product data to see what we're receiving
        console.log('🔍 Raw products from backend:', productos);
        
        this.productos = productos.map(product => {
          // Debug: Log each product's image data
          console.log(`📸 Product ${product.nombre} images:`, product.imagenes);
          
          return {
            _id: product._id,
            id: product._id,
            numeroProducto: product.numeroProducto,
            referencia: product.referencia || '',
            nombre: product.nombre || '',
            categoria: product.categoria || '',
            cantidadMinima: product.cantidadMinima || 0,
            imagenes: product.imagenes || [],
            fechaCreacion: product.createdAt || product.fechaCreacion ? new Date(product.createdAt || product.fechaCreacion) : new Date(),
            publicado: product.publicado || false,
            orden: product.ordenCategoria || product.orden || 1,
            ordenCategoria: product.ordenCategoria || product.orden || 1,
            medidas: product.medidas,
            descripcion: product.descripcion,
            precio: product.precio
          };
        });
        
        this.sortData();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        this.error = 'Error al cargar los productos. Por favor, intenta de nuevo.';
        this.productos = [];
        this.filteredProductos = [];
        this.isLoading = false;
      }
    });
  }

  private loadStats(): void {
    this.productsService.getStats().subscribe({
      next: (stats: any) => {
        this.stats = stats;
      },
      error: (error: any) => {
        if (this.productos && this.productos.length > 0) {
          const total = this.productos.length;
          const publicados = this.productos.filter(p => p.publicado).length;
          const noPublicados = total - publicados;
          
          const porCategoria: { [categoria: string]: number } = {};
          this.productos.forEach(p => {
            porCategoria[p.categoria] = (porCategoria[p.categoria] || 0) + 1;
          });
          
          this.stats = { total, publicados, noPublicados, porCategoria };
        }
      }
    });
  }

  applyFilters(): void {
    this.filteredProductos = this.productos.filter(producto => {
      const matchesReferencia = !this.filtroReferencia || 
        producto.referencia.toLowerCase().includes(this.filtroReferencia.toLowerCase());
      
      const matchesCategoria = !this.filtroCategoria || 
        producto.categoria.toLowerCase().includes(this.filtroCategoria.toLowerCase());
      
      const matchesCantidadMinima = !this.filtroCantidadMinima || 
        producto.cantidadMinima.toString().includes(this.filtroCantidadMinima);
      
      const matchesPublicado = !this.filtroPublicado || 
        (this.filtroPublicado === 'true' && producto.publicado) ||
        (this.filtroPublicado === 'false' && !producto.publicado);
      
      const matchesOrden = !this.filtroOrden || 
        (producto.ordenCategoria || producto.orden || 1).toString().includes(this.filtroOrden);
      
      return matchesReferencia && matchesCategoria && matchesCantidadMinima && 
             matchesPublicado && matchesOrden;
    });
  }

  clearFilters(): void {
    this.filtroReferencia = '';
    this.filtroCategoria = '';
    this.filtroCantidadMinima = '';
    this.filtroPublicado = '';
    this.filtroOrden = '';
    this.applyFilters();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortData();
  }

  sortData(): void {
    this.filteredProductos.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
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
          aValue = new Date(a.fechaCreacion).getTime();
          bValue = new Date(b.fechaCreacion).getTime();
          break;
        case 'publicado':
          aValue = a.publicado ? 1 : 0;
          bValue = b.publicado ? 1 : 0;
          break;
        case 'orden':
          aValue = a.ordenCategoria || a.orden || 1;
          bValue = b.ordenCategoria || b.orden || 1;
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

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return '↕️';
    }
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  hasProductImage(producto: Producto): boolean {
    const hasImage = !!(producto.imagenes && producto.imagenes.length > 0);
    console.log(`🖼️ hasProductImage for ${producto.nombre}:`, hasImage, 'imagenes:', producto.imagenes);
    return hasImage;
  }

  getProductImageUrl(producto: Producto): string {
    if (this.hasProductImage(producto)) {
      let imageUrl = producto.imagenes![0];
      
      // Convert relative URLs to absolute URLs with backend domain
      if (imageUrl.startsWith('/')) {
        imageUrl = `http://localhost:3000${imageUrl}`;
      }
      
      console.log(`🔗 Image URL for ${producto.nombre}:`, imageUrl);
      return imageUrl;
    }
    console.log(`❌ No image for ${producto.nombre}, using placeholder`);
    // Return a data URL placeholder instead of missing file
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAyMEM4LjQzIDIwIDIwIDguNDMgMjAgMjVTOC40MyAzMCAyNSAzMCAzMCA4LjQzIDMwIDI1UzguNDMgMjAgMjUgMjBaTTI1IDI3QzguNDMgMjcgMjcgOC40MyAyNyAyNVM4LjQzIDIzIDI1IDIzUzIzIDguNDMgMjMgMjVTOC40MyAyNyAyNSAyN1oiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
  }

  onImageError(event: any): void {
    // Prevent infinite loop by checking if we're already showing fallback
    if (event.target.src.includes('data:image') || event.target.dataset.fallbackUsed) {
      return;
    }
    
    // Mark that we've used fallback to prevent infinite loop
    event.target.dataset.fallbackUsed = 'true';
    
    // Use a simple data URL as fallback instead of missing file
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAyMEM4LjQzIDIwIDIwIDguNDMgMjAgMjVTOC40MyAzMCAyNSAzMCAzMCA4LjQzIDMwIDI1UzguNDMgMjAgMjUgMjBaTTI1IDI3QzguNDMgMjcgMjcgOC40MyAyNyAyNVM4LjQzIDIzIDI1IDIzUzIzIDguNDMgMjMgMjVTOC40MyAyNyAyNSAyN1oiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
  }

  isBeingReordered(producto: Producto): boolean {
    return this.reorderingProduct?._id === producto._id;
  }

  canMoveUp(producto: Producto): boolean {
    const productosCategoria = this.filteredProductos.filter(p => p.categoria === producto.categoria);
    productosCategoria.sort((a, b) => (a.ordenCategoria || 1) - (b.ordenCategoria || 1));
    return productosCategoria.indexOf(producto) > 0;
  }

  canMoveDown(producto: Producto): boolean {
    const productosCategoria = this.filteredProductos.filter(p => p.categoria === producto.categoria);
    productosCategoria.sort((a, b) => (a.ordenCategoria || 1) - (b.ordenCategoria || 1));
    return productosCategoria.indexOf(producto) < productosCategoria.length - 1;
  }

  moveUp(producto: Producto): void {
    const productId = producto._id || producto.id?.toString();
    if (!productId) return;

    const currentOrder = producto.ordenCategoria || producto.orden || 1;
    const newOrder = currentOrder - 1;

    if (newOrder < 1) {
      alert('No se puede mover el producto más arriba.');
      return;
    }

    this.reorderProduct(productId, newOrder, producto);
  }

  moveDown(producto: Producto): void {
    const productId = producto._id || producto.id?.toString();
    if (!productId) return;

    const currentOrder = producto.ordenCategoria || producto.orden || 1;
    const newOrder = currentOrder + 1;

    this.reorderProduct(productId, newOrder, producto);
  }

  private reorderProduct(productId: string, newOrder: number, producto: Producto): void {
    this.reorderingProduct = producto;
    
    this.productsService.updateProductOrder(productId, newOrder).subscribe({
      next: () => {
        this.reorderingProduct = null;
        this.loadProducts();
      },
      error: (error: any) => {
        this.reorderingProduct = null;
        alert('Error al reordenar. Por favor, intenta de nuevo.');
      }
    });
  }

  navigateToNewProduct(): void {
    this.router.navigate(['/logoadmin/productos/nuevo']);
  }

  editProduct(producto: Producto | string): void {
    const id = typeof producto === 'string' ? producto : (producto._id || producto.id?.toString());
    if (id) {
      this.router.navigate(['/logoadmin/productos/editar', id]);
    }
  }

  deleteProduct(producto: Producto | string): void {
    const id = typeof producto === 'string' ? producto : (producto._id || producto.id?.toString());
    if (id && confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.productsService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts();
          this.loadStats();
        },
        error: (error: any) => {
          alert('Error al eliminar el producto.');
        }
      });
    }
  }

  reloadData(): void {
    this.loadProducts();
    this.loadStats();
  }

  // Template methods
  createProduct(): void {
    this.navigateToNewProduct();
  }

  sort(column: string): void {
    this.sortBy(column);
  }

  trackByFn(index: number, item: Producto): any {
    return item._id || item.id || index;
  }

  getCategoriaClass(categoria: string): string {
    const categoriaLower = categoria?.toLowerCase() || '';
    if (categoriaLower.includes('caramelo')) return 'badge-warning';
    if (categoriaLower.includes('chocolate')) return 'badge-primary';
    if (categoriaLower.includes('galleta')) return 'badge-info';
    if (categoriaLower.includes('tarta')) return 'badge-danger';
    return 'badge-secondary';
  }

  getPublicadoClass(publicado: boolean): string {
    return publicado ? 'badge-success' : 'badge-danger';
  }

  getArrowColorClass(categoria: string): string {
    const categoriaLower = categoria?.toLowerCase() || '';
    if (categoriaLower.includes('caramelo')) return 'arrow-warning';
    if (categoriaLower.includes('chocolate')) return 'arrow-primary';
    if (categoriaLower.includes('galleta')) return 'arrow-info';
    if (categoriaLower.includes('tarta')) return 'arrow-danger';
    return 'arrow-secondary';
  }
}
