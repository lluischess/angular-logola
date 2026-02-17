import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CartServiceService } from '../../shared/services/cart-service.service';
import { CategoriesService, FrontCategory } from '../../services/categories.service';
import { ProductsService, FrontProduct } from '../../services/products.service';
import { SeoService, SeoMetadata } from '../../services/seo.service';
import { Subscription } from 'rxjs';

declare var bootstrap: any;

@Component({
  selector: 'app-page-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './page-grid.component.html',
  styleUrl: './page-grid.component.css'
})
export class PageGridComponent implements OnInit, OnDestroy {
  productos: FrontProduct[] = [];
  productosFiltrados: FrontProduct[] = [];
  categoriaSeleccionada: string = '';
  searchQuery: string = '';

  categoryTitle: string = '';
  isLoadingProducts: boolean = false;

  categoriaValida: boolean = true;
  categoriaEncontrada: FrontCategory | null = null;
  isLoadingCategory: boolean = false;
  categoryError: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private cartService: CartServiceService,
    private router: Router,
    private categoriesService: CategoriesService,
    private productsService: ProductsService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.categoriaSeleccionada = params.get('categoria') || '';

      if (this.categoriaSeleccionada) {
        this.validateCategory(this.categoriaSeleccionada);
      } else {
        this.categoriaValida = true;
        this.categoryTitle = 'Todos los productos';
        this.applyAllProductsSeoMetadata();
        this.loadAllProducts();
      }
    });

    this.route.queryParams.subscribe(queryParams => {
      this.searchQuery = queryParams['search'] || '';

      if (this.categoriaValida) {
        if (this.searchQuery.trim()) {
          this.searchProducts(this.searchQuery);
        } else {
          if (this.categoriaSeleccionada) {
            this.loadProductsByCategory(this.categoriaSeleccionada);
          } else {
            this.loadAllProducts();
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Aplicar metadatos SEO para la página de todos los productos
   */
  private applyAllProductsSeoMetadata(): void {
    this.seoService.updateSeoMetadata({
      title: 'Todos los Productos - Chocolates Personalizados Logolate',
      description: 'Explora todo el catálogo de chocolates y bombones personalizados de Logolate para hoteles, empresas y eventos. Pedidos desde 100 unidades.',
      keywords: 'chocolates personalizados, bombones personalizados, catálogo chocolates, logolate productos',
      ogTitle: 'Todos los Productos - Chocolates Personalizados Logolate',
      ogDescription: 'Explora todo el catálogo de chocolates y bombones personalizados de Logolate para hoteles, empresas y eventos.',
      canonical: this.seoService.buildCanonicalUrl('/productos')
    });
  }

  /**
   * Aplicar metadatos SEO de la categoría
   */
  private applyCategorySeoMetadata(category: FrontCategory): void {
    const seoMetadata: SeoMetadata = {
      title: category.metaTitulo || `${category.nombre} Personalizados - Logolate`,
      description: category.metaDescripcion || `Descubre nuestra selección de ${category.nombre.toLowerCase()} personalizados para hoteles y empresas. Pedidos desde 100 unidades.`,
      keywords: category.palabrasClave || `${category.nombre.toLowerCase()}, personalizados, hoteles, empresas, logolate`,
      ogTitle: category.ogTitulo || category.metaTitulo || `${category.nombre} Personalizados - Logolate`,
      ogDescription: category.ogDescripcion || category.metaDescripcion || `Descubre nuestra selección de ${category.nombre.toLowerCase()} personalizados para hoteles y empresas.`,
      ogImage: category.ogImagen || '',
      canonical: this.seoService.buildCanonicalUrl(`/productos/${category.urlSlug}`)
    };

    this.seoService.updateSeoMetadata(seoMetadata);
  }

  /**
   * Valida que la categoría esté publicada antes de mostrar productos
   */
  private validateCategory(slug: string): void {
    this.isLoadingCategory = true;
    this.categoriaValida = false;
    this.categoryError = '';

    this.categoriesService.getCategoryBySlug(slug).subscribe({
      next: (category) => {
        this.isLoadingCategory = false;

        if (category && category.publicado) {
          this.categoriaEncontrada = category;
          this.categoriaValida = true;
          this.categoryTitle = category.metaTitulo || category.nombre;
          this.applyCategorySeoMetadata(category);
          this.loadProductsByCategory(slug);
        } else if (category && !category.publicado) {
          this.categoriaValida = false;
          this.categoryError = 'Esta categoría no está disponible actualmente.';
          this.showCategoryNotAvailable();
        } else {
          this.categoriaValida = false;
          this.categoryError = 'Categoría no encontrada.';
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

  private showCategoryNotAvailable(): void {
    this.router.navigate(['/'], {
      queryParams: { message: 'La categoría solicitada no está disponible actualmente.' }
    });
  }

  private showCategoryNotFound(): void {
    this.router.navigate(['/'], {
      queryParams: { message: 'La categoría solicitada no existe.' }
    });
  }

  private showCategoryError(): void {
    this.router.navigate(['/'], {
      queryParams: { message: 'Error al cargar la categoría. Por favor, intenta de nuevo.' }
    });
  }

  /**
   * Cargar productos de una categoría específica
   */
  private loadProductsByCategory(categorySlug: string): void {
    this.isLoadingProducts = true;

    this.productsService.getProductsByCategory(categorySlug).subscribe({
      next: (products) => {
        this.productos = products;
        this.productosFiltrados = products;
        this.isLoadingProducts = false;
      },
      error: (error) => {
        console.error(`❌ [PAGE-GRID] Error cargando productos de categoría ${categorySlug}:`, error);
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

    this.productsService.getAllPublishedProducts().subscribe({
      next: (products) => {
        this.productos = products;
        this.productosFiltrados = products;
        this.isLoadingProducts = false;
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

    this.productsService.searchProducts(searchTerm).subscribe({
      next: (products) => {
        this.productos = products;
        this.productosFiltrados = products;
        this.isLoadingProducts = false;
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
    if (product.imagenes && Array.isArray(product.imagenes) && product.imagenes.length > 0) {
      return this.productsService.getAbsoluteImageUrl(product.imagenes[0]);
    }
    return this.productsService.getPlaceholderImage();
  }

  /**
   * Manejar error de carga de imagen
   */
  onImageError(event: any): void {
    if (event.target) {
      if (event.target.src.includes('placeholder-product.jpg') || event.target.src.includes('placeholder.jpg')) {
        event.target.style.display = 'none';
        return;
      }
      event.target.src = this.productsService.getPlaceholderImage();
    }
  }

  /**
   * Filtrar productos localmente (fallback para búsqueda sin backend)
   */
  filtrarProductos(): void {
    const query = this.searchQuery.toLowerCase().trim();

    this.productosFiltrados = this.productos.filter(producto => {
      const matchesCategoria = !this.categoriaSeleccionada || producto.categoria === this.categoriaSeleccionada;
      const matchesSearch = query
        ? producto.nombre.toLowerCase().includes(query) || producto.referencia.toLowerCase().includes(query)
        : true;

      return matchesCategoria && matchesSearch;
    });
  }

  addToCart(product: any) {
    this.cartService.addToCart(product);

    const offcanvasElement = document.getElementById('offcanvasCart');
    if (offcanvasElement) {
      let offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
      if (!offcanvas) {
        offcanvas = new bootstrap.Offcanvas(offcanvasElement);
      }

      offcanvasElement.addEventListener('hidden.bs.offcanvas', () => {
        const backdrop = document.querySelector('.offcanvas-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }, { once: true });

      offcanvas.show();
    }
  }

  onSearchSubmit(event: Event): void {
    event.preventDefault();
    this.filtrarProductos();
  }
}
