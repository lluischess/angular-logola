import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CartServiceService } from '../../shared/services/cart-service.service';
import { CategoriesService, FrontCategory } from '../../services/categories.service';
import { ProductsService, FrontProduct } from '../../services/products.service';

// Declarar Bootstrap para TypeScript
declare var bootstrap: any;

@Component({
  selector: 'app-page-grid',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './page-grid.component.html',
  styleUrl: './page-grid.component.css'
})
export class PageGridComponent implements OnInit {
  // Productos reales desde el backend
  productos: FrontProduct[] = [];
  productosFiltrados: FrontProduct[] = []; // Productos filtrados según la categoría y/o búsqueda
  categoriaSeleccionada: string = ''; // Categoría actual
  searchQuery: string = '';  // Término de búsqueda
  
  // Título dinámico de la categoría
  categoryTitle: string = '';
  isLoadingProducts: boolean = false;
  
  // Propiedades para validación de categorías
  categoriaValida: boolean = true;
  categoriaEncontrada: FrontCategory | null = null;
  isLoadingCategory: boolean = false;
  categoryError: string = '';

  constructor(
    private route: ActivatedRoute, 
    private cartService: CartServiceService,
    private router: Router,
    private categoriesService: CategoriesService,
    private productsService: ProductsService
  ) {}

  ngOnInit(): void {
    // Escuchar cambios en los parámetros de la URL (categoría y búsqueda)
    this.route.paramMap.subscribe(params => {
      this.categoriaSeleccionada = params.get('categoria') || ''; // Obtener la categoría
      
      if (this.categoriaSeleccionada) {
        // Validar que la categoría esté publicada antes de mostrar productos
        this.validateCategory(this.categoriaSeleccionada);
      } else {
        // Si no hay categoría seleccionada, mostrar todos los productos
        this.categoriaValida = true;
        this.categoryTitle = 'Todos los productos';
        this.loadAllProducts();
      }
    });

    // Escuchar cambios en los queryParams (búsqueda)
    this.route.queryParams.subscribe(queryParams => {
      this.searchQuery = queryParams['search'] || '';  // Obtener el término de búsqueda
      
      // Solo buscar si la categoría es válida
      if (this.categoriaValida) {
        if (this.searchQuery.trim()) {
          this.searchProducts(this.searchQuery);
        } else {
          // Si no hay búsqueda, recargar productos de la categoría
          if (this.categoriaSeleccionada) {
            this.loadProductsByCategory(this.categoriaSeleccionada);
          } else {
            this.loadAllProducts();
          }
        }
      }
    });
  }

  /**
   * Valida que la categoría esté publicada antes de mostrar productos
   */
  private validateCategory(slug: string): void {
    this.isLoadingCategory = true;
    this.categoriaValida = false;
    this.categoryError = '';
    
    console.log(`🔍 [PAGE-GRID] Validando categoría: ${slug}`);
    
    this.categoriesService.getCategoryBySlug(slug).subscribe({
      next: (category) => {
        this.isLoadingCategory = false;
        
        if (category && category.publicado) {
          // Categoría encontrada y publicada
          this.categoriaEncontrada = category;
          this.categoriaValida = true;
          
          // Establecer título dinámico de la categoría
          this.categoryTitle = category.seo?.metaTitle || category.nombre;
          
          // Cargar productos de esta categoría
          this.loadProductsByCategory(slug);
          
          console.log(`✅ [PAGE-GRID] Categoría válida y publicada: ${category.nombre}`);
        } else if (category && !category.publicado) {
          // Categoría encontrada pero despublicada
          this.categoriaValida = false;
          this.categoryError = 'Esta categoría no está disponible actualmente.';
          console.warn(`⚠️ [PAGE-GRID] Categoría despublicada: ${category.nombre}`);
          this.showCategoryNotAvailable();
        } else {
          // Categoría no encontrada
          this.categoriaValida = false;
          this.categoryError = 'Categoría no encontrada.';
          console.error(`❌ [PAGE-GRID] Categoría no encontrada: ${slug}`);
          this.showCategoryNotFound();
        }
      },
      error: (error) => {
        this.isLoadingCategory = false;
        this.categoriaValida = false;
        this.categoryError = 'Error al verificar la categoría.';
        console.error(`❌ [PAGE-GRID] Error validando categoría ${slug}:`, error);
        this.showCategoryError();
      }
    });
  }

  /**
   * Muestra mensaje cuando la categoría no está disponible (despublicada)
   */
  private showCategoryNotAvailable(): void {
    // Redirigir inmediatamente a la página principal con mensaje
    this.router.navigate(['/'], { 
      queryParams: { 
        message: 'La categoría solicitada no está disponible actualmente.' 
      }
    });
  }

  /**
   * Muestra mensaje cuando la categoría no existe
   */
  private showCategoryNotFound(): void {
    // Redirigir inmediatamente a la página principal con mensaje
    this.router.navigate(['/'], { 
      queryParams: { 
        message: 'La categoría solicitada no existe.' 
      }
    });
  }

  /**
   * Muestra mensaje cuando hay error al verificar la categoría
   */
  private showCategoryError(): void {
    // Redirigir inmediatamente a la página principal con mensaje
    this.router.navigate(['/'], { 
      queryParams: { 
        message: 'Error al cargar la categoría. Por favor, intenta de nuevo.' 
      }
    });
  }

  /**
   * Cargar productos de una categoría específica
   */
  private loadProductsByCategory(categorySlug: string): void {
    this.isLoadingProducts = true;
    console.log(`📦 [PAGE-GRID] === INICIANDO CARGA DE PRODUCTOS ===`);
    console.log(`📦 [PAGE-GRID] Categoría: ${categorySlug}`);
    console.log(`📦 [PAGE-GRID] Estado antes de la carga:`, {
      productos: this.productos.length,
      productosFiltrados: this.productosFiltrados.length,
      isLoadingProducts: this.isLoadingProducts
    });
    
    this.productsService.getProductsByCategory(categorySlug).subscribe({
      next: (products) => {
        console.log(`✅ [PAGE-GRID] === PRODUCTOS RECIBIDOS ===`);
        console.log(`✅ [PAGE-GRID] Cantidad de productos:`, products.length);
        console.log(`✅ [PAGE-GRID] Productos completos:`, products);
        
        this.productos = products;
        this.productosFiltrados = products;
        this.isLoadingProducts = false;
        
        console.log(`✅ [PAGE-GRID] Estado después de la carga:`, {
          productos: this.productos.length,
          productosFiltrados: this.productosFiltrados.length,
          isLoadingProducts: this.isLoadingProducts
        });
      },
      error: (error) => {
        console.error(`❌ [PAGE-GRID] === ERROR CARGANDO PRODUCTOS ===`);
        console.error(`❌ [PAGE-GRID] Categoría: ${categorySlug}`);
        console.error(`❌ [PAGE-GRID] Error completo:`, error);
        console.error(`❌ [PAGE-GRID] Status:`, error.status);
        console.error(`❌ [PAGE-GRID] Message:`, error.message);
        
        this.productos = [];
        this.productosFiltrados = [];
        this.isLoadingProducts = false;
      }
    });
  }

  /**
   * Cargar todos los productos publicados
   */
  private loadAllProducts(): void {
    this.isLoadingProducts = true;
    console.log('📦 [PAGE-GRID] Cargando todos los productos');
    
    this.productsService.getAllPublishedProducts().subscribe({
      next: (products) => {
        this.productos = products;
        this.productosFiltrados = products;
        this.isLoadingProducts = false;
        console.log('✅ [PAGE-GRID] Todos los productos cargados:', products);
      },
      error: (error) => {
        console.error('❌ [PAGE-GRID] Error cargando todos los productos:', error);
        this.productos = [];
        this.productosFiltrados = [];
        this.isLoadingProducts = false;
      }
    });
  }

  /**
   * Buscar productos por término de búsqueda
   */
  private searchProducts(searchTerm: string): void {
    this.isLoadingProducts = true;
    console.log(`🔍 [PAGE-GRID] Buscando productos: ${searchTerm}`);
    
    this.productsService.searchProducts(searchTerm).subscribe({
      next: (products) => {
        this.productos = products;
        this.productosFiltrados = products;
        this.isLoadingProducts = false;
        console.log('✅ [PAGE-GRID] Productos de búsqueda:', products);
      },
      error: (error) => {
        console.error(`❌ [PAGE-GRID] Error en búsqueda de productos:`, error);
        this.productos = [];
        this.productosFiltrados = [];
        this.isLoadingProducts = false;
      }
    });
  }

  /**
   * Obtener URL absoluta para imagen de producto
   */
  getProductImageUrl(product: FrontProduct): string {
    console.log(`🖼️ [PAGE-GRID] === PROCESANDO IMAGEN DE PRODUCTO ===`);
    console.log(`🖼️ [PAGE-GRID] Producto:`, product.nombre);
    console.log(`🖼️ [PAGE-GRID] Campo imagenes del producto:`, product.imagenes);
    console.log(`🖼️ [PAGE-GRID] Tipo de imagenes:`, typeof product.imagenes);
    console.log(`🖼️ [PAGE-GRID] Es array:`, Array.isArray(product.imagenes));
    
    // Usar la primera imagen del array de imágenes
    if (product.imagenes && Array.isArray(product.imagenes) && product.imagenes.length > 0) {
      const firstImage = product.imagenes[0];
      console.log(`🖼️ [PAGE-GRID] Primera imagen encontrada:`, firstImage);
      
      const absoluteUrl = this.productsService.getAbsoluteImageUrl(firstImage);
      console.log(`🖼️ [PAGE-GRID] URL absoluta generada:`, absoluteUrl);
      return absoluteUrl;
    } else {
      const placeholderUrl = this.productsService.getPlaceholderImage();
      console.log(`🖼️ [PAGE-GRID] Usando placeholder (no hay imágenes):`, placeholderUrl.substring(0, 50) + '...');
      return placeholderUrl;
    }
  }

  /**
   * Manejar error de carga de imagen
   */
  onImageError(event: any): void {
    if (event.target) {
      // Evitar bucle infinito: si ya es el placeholder, no hacer nada más
      if (event.target.src.includes('placeholder-product.jpg') || event.target.src.includes('placeholder.jpg')) {
        console.log('⚠️ [PAGE-GRID] Error cargando placeholder, ocultando imagen');
        event.target.style.display = 'none';
        return;
      }
      
      event.target.src = this.productsService.getPlaceholderImage();
    }
  }

  /**
   * Función para filtrar productos localmente (fallback)
   */
  filtrarProductos(): void {
    const query = this.searchQuery.toLowerCase().trim();

    // Filtrar productos que coincidan con la categoría y/o búsqueda
    this.productosFiltrados = this.productos.filter(producto => {
      const matchesCategoria = !this.categoriaSeleccionada || producto.categoria === this.categoriaSeleccionada;
      const matchesSearch = query
        ? producto.nombre.toLowerCase().includes(query) || producto.referencia.toLowerCase().includes(query)
        : true;

      return matchesCategoria && matchesSearch; // Producto debe coincidir con ambas condiciones
    });
  }
  // Función para añadir productos al carrito
  addToCart(product: any) {
    this.cartService.addToCart(product);
    console.log(`${product.nombre} añadido al carrito`);
    
    // Abrir el offcanvas del carrito automáticamente
    const offcanvasElement = document.getElementById('offcanvasCart');
    if (offcanvasElement) {
      // Verificar si ya existe una instancia del offcanvas
      let offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
      if (!offcanvas) {
        offcanvas = new bootstrap.Offcanvas(offcanvasElement);
      }
      
      // Añadir event listener para limpiar el backdrop cuando se cierre
      offcanvasElement.addEventListener('hidden.bs.offcanvas', () => {
        // Limpiar cualquier backdrop que pueda quedar
        const backdrop = document.querySelector('.offcanvas-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        // Restaurar el scroll del body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }, { once: true });
      
      offcanvas.show();
    }
  }

  // Función que se llamará cuando el usuario haga submit en el buscador
  onSearchSubmit(event: Event): void {
    event.preventDefault();
    this.filtrarProductos();
  }
}
