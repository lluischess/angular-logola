import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewEncapsulation, CUSTOM_ELEMENTS_SCHEMA, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { CartServiceService } from '../../shared/services/cart-service.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductsService, FrontProduct } from '../../services/products.service';
import { SeoService, SeoMetadata } from '../../services/seo.service';
import { Subscription } from 'rxjs';

import { register } from 'swiper/element/bundle';

declare var bootstrap: any;

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

  public modalImageSrc: string = '';
  public modalImageTitle: string = '';

  private subscriptions: Subscription[] = [];


  constructor(
    private cartService: CartServiceService,
    private route: ActivatedRoute,
    private el: ElementRef,
    public productsService: ProductsService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
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
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.seoService.removeJsonLd();
  }

  /**
   * Aplicar metadatos SEO del producto
   */
  private applyProductSeoMetadata(product: FrontProduct): void {
    const seoMetadata: SeoMetadata = {
      title: product.metaTitulo || `${product.nombre} - Logolate`,
      description: product.metaDescripcion || `${product.nombre}. Producto artesanal de calidad premium. Medidas: ${product.medidas || 'Consultar'}. Referencia: ${product.referencia}`,
      keywords: product.palabrasClave || `${product.nombre.toLowerCase()}, ${product.categoria.toLowerCase()}, artesanal, premium, logolate, ${product.referencia.toLowerCase()}`,
      ogTitle: product.ogTitulo || product.metaTitulo || `${product.nombre} - Logolate`,
      ogDescription: product.ogDescripcion || product.metaDescripcion || `${product.nombre}. Producto artesanal de calidad premium.`,
      ogImage: product.ogImagen || (product.imagenes && product.imagenes.length > 0 ? this.productsService.getAbsoluteImageUrl(product.imagenes[0]) : ''),
      canonical: this.seoService.buildCanonicalUrl(`/producto/${product.urlSlug}`)
    };

    this.seoService.updateSeoMetadata(seoMetadata);
    this.injectProductSchema(product);
  }

  /**
   * Inyectar schema.org/Product con datos del producto
   */
  private injectProductSchema(product: FrontProduct): void {
    const imageUrl = product.imagenes && product.imagenes.length > 0
      ? this.productsService.getAbsoluteImageUrl(product.imagenes[0])
      : '';

    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.nombre,
      description: product.metaDescripcion || product.descripcion || `${product.nombre}. Producto artesanal personalizado de calidad premium.`,
      image: imageUrl,
      sku: product.referencia,
      brand: {
        '@type': 'Brand',
        name: 'Logolate'
      },
      category: product.categoria,
      url: this.seoService.buildCanonicalUrl(`/producto/${product.urlSlug}`),
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/InStock',
        priceCurrency: 'EUR',
        seller: {
          '@type': 'Organization',
          name: 'Logolate'
        }
      }
    };

    if (product.medidas) {
      schema.additionalProperty = {
        '@type': 'PropertyValue',
        name: 'Medidas',
        value: product.medidas
      };
    }

    this.seoService.injectJsonLd(schema);
  }

  /**
   * Cargar producto desde el backend por URL Slug
   */
  private loadProduct(productSlug: string): void {
    this.isLoadingProduct = true;
    this.hasError = false;
    this.isProductUnpublished = false;
    this.producto = null;

    this.productsService.getProductBySlug(productSlug).subscribe({
      next: (product: FrontProduct) => {
        this.isLoadingProduct = false;

        if (product) {
          this.producto = product;

          if (!product.publicado) {
            this.isProductUnpublished = true;
            return;
          }

          this.applyProductSeoMetadata(product);
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

    this.productsService.getProductsByCategory(categoria).subscribe({
      next: (products: FrontProduct[]) => {
        this.isLoadingRelated = false;

        if (products && products.length > 0) {
          this.relatedProducts = products
            .filter(p => p._id !== this.producto?._id)
            .slice(0, 8);

          setTimeout(() => {
            this.initializeSwiper();
          }, 100);
        } else {
          this.relatedProducts = [];
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
  }

  ngAfterViewInit() {
    this.initializeSwiper();
  }

  /**
   * Inicializar o reinicializar el Swiper de productos relacionados
   */
  private initializeSwiper(): void {
    if (!this.swiper) {
      return;
    }

    const swiperEl = this.swiper.nativeElement;

    if (swiperEl.swiper) {
      swiperEl.swiper.destroy(true, true);
    }

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

    swiperEl.initialize();

    const prevButton = this.el.nativeElement.querySelector('.products-carousel-prev');
    const nextButton = this.el.nativeElement.querySelector('.products-carousel-next');

    if (prevButton && nextButton) {
      prevButton.addEventListener('click', () => {
        swiperEl.swiper.slidePrev();
      });

      nextButton.addEventListener('click', () => {
        swiperEl.swiper.slideNext();
      });

      swiperEl.addEventListener('slidechange', () => {
        prevButton.classList.toggle('swiper-button-disabled', swiperEl.swiper.isBeginning);
        nextButton.classList.toggle('swiper-button-disabled', swiperEl.swiper.isEnd);

        prevButton.disabled = swiperEl.swiper.isBeginning;
        nextButton.disabled = swiperEl.swiper.isEnd;

        prevButton.setAttribute('aria-disabled', swiperEl.swiper.isBeginning.toString());
        nextButton.setAttribute('aria-disabled', swiperEl.swiper.isEnd.toString());
      });
    }
  }

  /**
   * Obtener URL de imagen del producto
   */
  getProductImageUrl(producto: FrontProduct): string {
    const firstImage = producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0] : '';
    return this.productsService.getAbsoluteImageUrl(firstImage);
  }

  /**
   * Obtener URL de imagen específica por índice
   */
  getProductImageByIndex(producto: FrontProduct, index: number): string {
    if (!producto.imagenes || producto.imagenes.length === 0) {
      return this.productsService.getAbsoluteImageUrl('');
    }

    const imageIndex = Math.min(index, producto.imagenes.length - 1);
    return this.productsService.getAbsoluteImageUrl(producto.imagenes[imageIndex]);
  }

  /**
   * Verificar si el producto tiene múltiples imágenes
   */
  hasMultipleImages(producto: FrontProduct): boolean {
    return !!(producto.imagenes && producto.imagenes.length > 1);
  }

  /**
   * Obtener array de imágenes secundarias (excluyendo la primera)
   */
  getSecondaryImages(producto: FrontProduct): string[] {
    if (!producto.imagenes || producto.imagenes.length <= 1) {
      return [];
    }

    return producto.imagenes.slice(1, 3);
  }

  /**
   * Manejar error de imagen
   */
  onImageError(event: any): void {
    if (event.target.src.includes('placeholder-product.jpg')) {
      event.target.style.display = 'none';
      return;
    }

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
