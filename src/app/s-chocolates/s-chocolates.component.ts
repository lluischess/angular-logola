import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { register } from 'swiper/element/bundle';
import { CartServiceService } from '../shared/services/cart-service.service';
import { CategoriesService, FrontCategory } from '../services/categories.service';
import { ProductsService, FrontProduct } from '../services/products.service';

// Declarar Bootstrap para TypeScript
declare var bootstrap: any;

register(); // Register Swiper custom elements

@Component({
  selector: 'app-s-chocolates',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './s-chocolates.component.html',
  styleUrls: ['./s-chocolates.component.css']
})
export class SChocolatesComponent implements OnInit, AfterViewInit {
  @ViewChild('swiper') swiper!: ElementRef;

  // Propiedades para la categoría de chocolates (orden 1)
  chocolatesCategory: FrontCategory | null = null;
  categoryTitle: string = 'Chocolates';
  categorySlug: string = '';
  
  // Propiedades para los productos
  productos: FrontProduct[] = [];
  isLoadingCategory: boolean = false;
  isLoadingProducts: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';

  constructor(
    private cartService: CartServiceService,
    private categoriesService: CategoriesService,
    private productsService: ProductsService
  ) {}

  ngOnInit(): void {
    this.loadChocolatesCategory();
  }

  ngAfterViewInit() {
    // Inicializar Swiper al montar el componente
    this.initializeSwiper();
  }
  
  /**
   * Inicializar o reinicializar el Swiper
   */
  private initializeSwiper(): void {
    if (!this.swiper) {
      console.log('⚠️ [S-CHOCOLATES] Swiper ViewChild no disponible aún');
      return;
    }
    
    const swiperEl = this.swiper.nativeElement;
    
    // Si ya está inicializado, destruirlo primero
    if (swiperEl.swiper) {
      swiperEl.swiper.destroy(true, true);
    }
    
    const swiperParams = {
      slidesPerView: 4,
      spaceBetween: 30,
      navigation: {
        prevEl: '.chocolates-carousel-prev',
        nextEl: '.chocolates-carousel-next',
      },
      breakpoints: {
        320: {
          slidesPerView: 1,
        },
        768: {
          slidesPerView: 2,
        },
        1024: {
          slidesPerView: 3,
        },
        1200: {
          slidesPerView: 4,
        },
      },
    };

    Object.assign(swiperEl, swiperParams);
    swiperEl.initialize();
    
    console.log('✅ [S-CHOCOLATES] Swiper inicializado/reinicializado');
  }

  /**
   * Cargar la categoría con orden 1 (Chocolates)
   */
  private loadChocolatesCategory(): void {
    this.isLoadingCategory = true;
    this.hasError = false;
    
    this.categoriesService.getCategoryByOrder(1).subscribe({
      next: (category: FrontCategory | null) => {
        this.isLoadingCategory = false;
        
        if (category) {
          this.chocolatesCategory = category;
          this.categoryTitle = category.metaTitulo || category.nombre;
          this.categorySlug = category.urlSlug || category.slug || '';
          
          console.log('✅ [S-CHOCOLATES] Categoría encontrada:', category.nombre);
          console.log('✅ [S-CHOCOLATES] Slug:', this.categorySlug);
          
          // Cargar productos de la categoría de chocolates
          this.loadChocolatesProducts(this.categorySlug);
        } else {
          this.showError('No se encontró una categoría con orden 1 (Chocolates)');
        }
      },
      error: (error: any) => {
        console.error('❌ [S-CHOCOLATES] Error cargando categoría:', error);
        this.isLoadingCategory = false;
        this.showError('Error al cargar la categoría de chocolates');
      }
    });
  }
  
  /**
   * Cargar hasta 20 productos de la categoría de chocolates
   */
  private loadChocolatesProducts(categorySlug: string): void {
    this.isLoadingProducts = true;
    
    this.productsService.getProductsByCategory(categorySlug).subscribe({
      next: (products: FrontProduct[]) => {
        this.isLoadingProducts = false;
        
        if (products && products.length > 0) {
          // Limitar a máximo 20 productos y ordenar por ordenCategoria
          const sortedProducts = products
            .sort((a, b) => (a.ordenCategoria || 0) - (b.ordenCategoria || 0))
            .slice(0, 20);
          
          this.productos = sortedProducts;
          console.log(`✅ [S-CHOCOLATES] ${this.productos.length} productos cargados`);
          
          // Reinicializar Swiper después de cargar productos
          setTimeout(() => {
            this.initializeSwiper();
          }, 100);
        } else {
          this.productos = [];
          console.log('⚠️ [S-CHOCOLATES] No hay productos en la categoría');
        }
      },
      error: (error: any) => {
        console.error('❌ [S-CHOCOLATES] Error cargando productos:', error);
        this.isLoadingProducts = false;
        this.productos = [];
      }
    });
  }
  
  /**
   * Mostrar mensaje de error
   */
  private showError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    console.error(`❌ [S-CHOCOLATES] ${message}`);
  }
  
  /**
   * Obtener URL de imagen del producto
   */
  getProductImageUrl(producto: FrontProduct): string {
    const firstImage = producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0] : '';
    return this.productsService.getAbsoluteImageUrl(firstImage);
  }
  
  /**
   * Manejar error de imagen
   */
  onImageError(event: any): void {
    // Evitar bucle infinito: si ya es el placeholder, no hacer nada más
    if (event.target.src.includes('placeholder-product.jpg')) {
      console.log('⚠️ [S-CHOCOLATES] Error cargando placeholder, ocultando imagen');
      event.target.style.display = 'none';
      return;
    }
    
    event.target.src = this.productsService.getAbsoluteImageUrl('');
  }
  
  /**
   * TrackBy function para optimizar el renderizado
   */
  trackByProductId(index: number, producto: FrontProduct): string {
    return producto._id;
  }

  addToCart(producto: any) {
    this.cartService.addToCart(producto);
    console.log(`${producto.nombre} añadido al carrito`);
    
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
}
