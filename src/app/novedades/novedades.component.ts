import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { register } from 'swiper/element/bundle';
import { CartServiceService } from '../shared/services/cart-service.service';
import { CategoriesService, FrontCategory } from '../services/categories.service';
import { ProductsService, FrontProduct } from '../services/products.service';

// Declarar Bootstrap para TypeScript
declare var bootstrap: any;

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './novedades.component.html',
  styleUrls: ['./novedades.component.css']
})
export class NovedadesComponent implements OnInit {
  // Propiedades para la categoría especial
  specialCategory: FrontCategory | null = null;
  categoryTitle: string = 'Novedades';
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
    this.loadSpecialCategory();
  }

  /**
   * Cargar la categoría marcada como "Configuración Especial"
   */
  private loadSpecialCategory(): void {
    this.isLoadingCategory = true;
    this.hasError = false;

    this.categoriesService.getSpecialCategory().subscribe({
      next: (category: FrontCategory | null) => {
        this.isLoadingCategory = false;

        if (category) {
          this.specialCategory = category;
          this.categoryTitle = category.metaTitulo || category.nombre;
          // El backend devuelve 'urlSlug' no 'slug'
          this.categorySlug = category.urlSlug || category.slug;

          // Cargar productos de la categoría especial
          this.loadSpecialProducts(this.categorySlug);
        } else {
          this.showError('No se encontró una categoría marcada como especial');
        }
      },
      error: (error: any) => {
        console.error('Error cargando categoría especial:', error);
        this.isLoadingCategory = false;
        this.showError('Error al cargar la categoría especial');
      }
    });
  }

  /**
   * Cargar hasta 6 productos de la categoría especial
   */
  private loadSpecialProducts(categorySlug: string): void {
    this.isLoadingProducts = true;

    this.productsService.getProductsByCategory(categorySlug).subscribe({
      next: (products: FrontProduct[]) => {
        this.isLoadingProducts = false;

        if (products && products.length > 0) {
          // Limitar a máximo 6 productos y ordenar por ordenCategoria
          const sortedProducts = products
            .sort((a, b) => (a.ordenCategoria || 0) - (b.ordenCategoria || 0))
            .slice(0, 6);

          this.productos = sortedProducts;
        } else {
          this.productos = [];
        }
      },
      error: (error: any) => {
        console.error('Error cargando productos especiales:', error);
        this.isLoadingProducts = false;
        this.productos = [];
      }
    });
  }

  /**
   * Mostrar error
   */
  private showError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.productos = [];
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
      // Evitar bucle infinito: si ya es el placeholder, no hacer nada más
      if (event.target.src.includes('placeholder-product.jpg') || event.target.src.includes('placeholder.jpg')) {
        //console.log('⚠️ [NOVEDADES] Error cargando placeholder, ocultando imagen');
        event.target.style.display = 'none';
        return;
      }

      event.target.src = this.productsService.getPlaceholderImage();
    }
  }

  /**
   * TrackBy function para optimizar el renderizado de la lista
   */
  trackByProductId(index: number, product: FrontProduct): string {
    return product._id;
  }

  addToCart(producto: any) {
    this.cartService.addToCart(producto);
    //console.log(`${producto.nombre} añadido al carrito`);

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
