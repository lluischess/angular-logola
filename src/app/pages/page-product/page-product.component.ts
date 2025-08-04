import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewEncapsulation, CUSTOM_ELEMENTS_SCHEMA, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { CartServiceService } from '../../shared/services/cart-service.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductsService, FrontProduct } from '../../services/products.service';
import { SeoService, SeoMetadata } from '../../services/seo.service';
import { Subscription } from 'rxjs';

// Importar Swiper
import { register } from 'swiper/element/bundle';

// Declarar Bootstrap para TypeScript
declare var bootstrap: any;

// Registrar Swiper como elemento web
register();

@Component({
  selector: 'app-page-product',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './page-product.component.html',
  styleUrls: ['./page-product.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PageProductComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('swiper') swiper!: ElementRef;
  public producto: FrontProduct | null = null;
  public relatedProducts: FrontProduct[] = [];
  public isLoadingProduct: boolean = false;
  public isLoadingRelated: boolean = false;
  public hasError: boolean = false;
  public errorMessage: string = '';
  public isProductUnpublished: boolean = false;
  
  // Propiedades para el modal de imagen
  public modalImageSrc: string = '';
  public modalImageTitle: string = '';
  
  // Subscripciones para limpieza
  private subscriptions: Subscription[] = [];



  constructor(
    private cartService: CartServiceService,
    private route: ActivatedRoute,
    private el: ElementRef,
    private productsService: ProductsService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    // Suscribirse a los cambios de parámetros de ruta
    this.route.paramMap.subscribe(params => {
      const productSlug = params.get('slug');
      if (productSlug) {
        this.loadProduct(productSlug);
      } else {
        this.showError('URL de producto no válida');
      }
    });
  }

  ngOnDestroy(): void {
    // Limpiar subscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Aplicar metadatos SEO del producto
   */
  private applyProductSeoMetadata(product: FrontProduct): void {
    console.log('📱 [PAGE-PRODUCT] === APLICANDO METADATOS SEO DE PRODUCTO ===');
    console.log('📱 [PAGE-PRODUCT] Producto:', product.nombre);
    console.log('📱 [PAGE-PRODUCT] Campos SEO directos:');
    console.log('  - metaTitulo:', product.metaTitulo);
    console.log('  - metaDescripcion:', product.metaDescripcion);
    console.log('  - palabrasClave:', product.palabrasClave);
    console.log('  - ogTitulo:', product.ogTitulo);
    console.log('  - ogDescripcion:', product.ogDescripcion);
    console.log('  - ogImagen:', product.ogImagen);
    
    const seoMetadata: SeoMetadata = {
      title: product.metaTitulo || `${product.nombre} - Logolate`,
      description: product.metaDescripcion || `${product.nombre}. Producto artesanal de calidad premium. Medidas: ${product.medidas || 'Consultar'}. Referencia: ${product.referencia}`,
      keywords: product.palabrasClave || `${product.nombre.toLowerCase()}, ${product.categoria.toLowerCase()}, artesanal, premium, logolate, ${product.referencia.toLowerCase()}`,
      ogTitle: product.ogTitulo || product.metaTitulo || `${product.nombre} - Logolate`,
      ogDescription: product.ogDescripcion || product.metaDescripcion || `${product.nombre}. Producto artesanal de calidad premium.`,
      ogImage: product.ogImagen || (product.imagenes && product.imagenes.length > 0 ? this.productsService.getAbsoluteImageUrl(product.imagenes[0]) : ''),
      canonical: `http://localhost:4200/producto/${product.urlSlug}`
    };
    
    console.log('📱 [PAGE-PRODUCT] Metadatos SEO preparados:', seoMetadata);

    // Aplicar metadatos SEO
    this.seoService.updateSeoMetadata(seoMetadata);
    console.log('📱 [PAGE-PRODUCT] Metadatos SEO aplicados para producto:', product.nombre);
  }

  /**
   * Cargar producto desde el backend por URL Slug
   */
  private loadProduct(productSlug: string): void {
    this.isLoadingProduct = true;
    this.hasError = false;
    this.isProductUnpublished = false;
    this.producto = null;
    
    console.log(`🔍 [PAGE-PRODUCT] Cargando producto con Slug: ${productSlug}`);
    
    this.productsService.getProductBySlug(productSlug).subscribe({
      next: (product: FrontProduct) => {
        this.isLoadingProduct = false;
        
        if (product) {
          this.producto = product;
          console.log(`✅ [PAGE-PRODUCT] Producto cargado:`, product.nombre);
          console.log(`✅ [PAGE-PRODUCT] URL Slug:`, product.urlSlug);
          console.log(`✅ [PAGE-PRODUCT] Publicado:`, product.publicado);
          
          // Verificar si el producto está despublicado
          if (!product.publicado) {
            this.isProductUnpublished = true;
            console.log(`⚠️ [PAGE-PRODUCT] Producto despublicado, mostrando mensaje informativo`);
            // No cargar productos relacionados para productos despublicados
            return;
          }
          
          // Aplicar metadatos SEO del producto
          this.applyProductSeoMetadata(product);
          
          // Solo cargar productos relacionados si el producto está publicado
          this.loadRelatedProducts(product.categoria);
        } else {
          this.showError('Producto no encontrado');
        }
      },
      error: (error: any) => {
        console.error('❌ [PAGE-PRODUCT] Error cargando producto:', error);
        this.isLoadingProduct = false;
        this.showError('Error al cargar el producto. Por favor, intenta de nuevo.');
      }
    });
  }
  
  /**
   * Cargar productos relacionados de la misma categoría
   */
  private loadRelatedProducts(categoria: string): void {
    this.isLoadingRelated = true;
    
    console.log(`🔍 [PAGE-PRODUCT] Cargando productos relacionados de categoría: ${categoria}`);
    
    this.productsService.getProductsByCategory(categoria).subscribe({
      next: (products: FrontProduct[]) => {
        this.isLoadingRelated = false;
        
        if (products && products.length > 0) {
          // Filtrar el producto actual y limitar a 8 productos relacionados
          this.relatedProducts = products
            .filter(p => p._id !== this.producto?._id)
            .slice(0, 8);
          
          console.log(`✅ [PAGE-PRODUCT] ${this.relatedProducts.length} productos relacionados cargados`);
          
          // Reinicializar Swiper después de cargar productos relacionados
          setTimeout(() => {
            this.initializeSwiper();
          }, 100);
        } else {
          this.relatedProducts = [];
          console.log('⚠️ [PAGE-PRODUCT] No hay productos relacionados');
        }
      },
      error: (error: any) => {
        console.error('❌ [PAGE-PRODUCT] Error cargando productos relacionados:', error);
        this.isLoadingRelated = false;
        this.relatedProducts = [];
      }
    });
  }
  
  /**
   * Mostrar mensaje de error
   */
  private showError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.isLoadingProduct = false;
    this.isLoadingRelated = false;
    console.error(`❌ [PAGE-PRODUCT] ${message}`);
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
      console.log('⚠️ [PAGE-PRODUCT] Swiper ViewChild no disponible aún');
      return;
    }
    
    const swiperEl = this.swiper.nativeElement;
    
    // Si ya está inicializado, destruirlo primero
    if (swiperEl.swiper) {
      swiperEl.swiper.destroy(true, true);
    }
    
    // Configurar Swiper
    Object.assign(swiperEl, {
      slidesPerView: 1,
      spaceBetween: 30,
      watchOverflow: true,
      breakpoints: {
        640: { slidesPerView: 2, spaceBetween: 30 },
        768: { slidesPerView: 3, spaceBetween: 30 },
        1024: { slidesPerView: 4, spaceBetween: 30 }
      }
    });

    // Inicializar Swiper
    swiperEl.initialize();

    // Configurar los botones de navegación
    const prevButton = this.el.nativeElement.querySelector('.products-carousel-prev');
    const nextButton = this.el.nativeElement.querySelector('.products-carousel-next');

    if (prevButton && nextButton) {
      prevButton.addEventListener('click', () => {
        swiperEl.swiper.slidePrev();
      });

      nextButton.addEventListener('click', () => {
        swiperEl.swiper.slideNext();
      });

      // Actualizar estado de los botones
      swiperEl.addEventListener('slidechange', () => {
        prevButton.classList.toggle('swiper-button-disabled', swiperEl.swiper.isBeginning);
        nextButton.classList.toggle('swiper-button-disabled', swiperEl.swiper.isEnd);

        prevButton.disabled = swiperEl.swiper.isBeginning;
        nextButton.disabled = swiperEl.swiper.isEnd;

        prevButton.setAttribute('aria-disabled', swiperEl.swiper.isBeginning.toString());
        nextButton.setAttribute('aria-disabled', swiperEl.swiper.isEnd.toString());
      });
    }
    
    console.log('✅ [PAGE-PRODUCT] Swiper inicializado/reinicializado');
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
      console.log('⚠️ [PAGE-PRODUCT] Error cargando placeholder, ocultando imagen');
      event.target.style.display = 'none';
      return;
    }
    
    console.log('⚠️ [PAGE-PRODUCT] Error cargando imagen, usando fallback');
    event.target.src = 'assets/images/placeholder-product.jpg';
  }
  
  /**
   * TrackBy function para optimizar el rendering de productos relacionados
   */
  trackByProductId(index: number, producto: FrontProduct): string {
    return producto._id;
  }

  addToCart(product: FrontProduct) {
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

  // Método para abrir el modal de imagen
  openImageModal(imageSrc: string, imageTitle: string) {
    this.modalImageSrc = imageSrc;
    this.modalImageTitle = imageTitle;
    
    const modalElement = document.getElementById('imageModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }
}
