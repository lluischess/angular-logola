import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation, CUSTOM_ELEMENTS_SCHEMA, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { CartServiceService } from '../../shared/services/cart-service.service';
import { ActivatedRoute, RouterModule } from '@angular/router';

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
export class PageProductComponent implements OnInit, AfterViewInit {
  @ViewChild('swiper') swiper!: ElementRef;
  public producto: any;
  public relatedProducts: any[] = [];

  productos = [
    {
      id: 1,
      nombre: 'BOMBÓN NAVIDAD EN BOLSA UNITARIA PERSONALIZADA',
      categoria: 'chocolates',
      referencia: 'BE-015-156',
      imagen: 'assets/images/BE-015-156.jpg',
      medidas: 'Medidas 72 x 59 mm'
    },
    {
      id: 2,
      nombre: 'Bote personalizado con Bolas de Cereales con Chocolate',
      categoria: 'chocolates',
      referencia: 'EN-148',
      imagen: 'assets/images/EN-148.jpg',
      medidas: 'Medidas 72 x 59 mm'
    },
    {
      id: 3,
      nombre: 'Bote personalizado con Catanias',
      categoria: 'chocolates',
      referencia: 'EN-134',
      imagen: 'assets/images/EN-134.jpg',
      medidas: 'Medidas 72 x 59 mm'
    },
    {
      id: 4,
      nombre: 'Catánias 35g en estuche Medium Faja',
      categoria: 'chocolates',
      referencia: 'SS-201-003',
      imagen: 'assets/images/SS-201-003.jpg',
      medidas: 'Medidas 60 x 60 x 55 mm'
    },
    {
      id: 5,
      nombre: 'Bombon de Yogur y Fresa cubo medium',
      categoria: 'chocolates',
      referencia: 'SS-202',
      imagen: 'assets/images/SS-202.jpg',
      medidas: 'Medidas  60 x 40 x 55 mm'
    },
    {
      id: 6,
      nombre: 'Chocolates Levels Piramid',
      categoria: 'chocolates',
      referencia: 'CO-000',
      imagen: 'assets/images/CO-000.jpg',
      medidas: 'Medidas 13 x 13 x 9,5 cm'
    },
    {
      id: 7,
      nombre: 'Cub Gajos Jelly',
      categoria: 'caramelos',
      referencia: 'FC-056-01',
      imagen: 'assets/images/FC-056-01.jpg',
      medidas: 'Medidas 5 x 5 x 5 cm'
    },
    {
      id: 8,
      nombre: 'Caja Pastis con Moras de Colores',
      categoria: 'caramelos',
      referencia: 'FC-307-01',
      imagen: 'assets/images/FC-307-01.jpg',
      medidas: 'Medidas 5 x 5 x 5 cm'
    },
    {
      id: 9,
      nombre: 'Tetris de Gominola',
      categoria: 'caramelos',
      referencia: 'FC-036',
      imagen: 'assets/images/FC-036.jpg',
      medidas: 'Medidas 7 x 7 x 7 cm'
    },
    {
      id: 10,
      nombre: 'Cata 9 Bombones Artesanos',
      categoria: 'novedades',
      referencia: 'SS-012',
      imagen: 'assets/images/SS-012.jpg',
      medidas: 'Medidas 10 x 10 x 2,5 cm'
    },
    {
      id: 11,
      nombre: 'CALENDARIO ADVIENTO LUX',
      categoria: 'navidad',
      referencia: 'NA-040',
      imagen: 'assets/images/NA-040.jpg',
      medidas: 'Medidas  330 x 130 x 45 mm'
    },
    {
      id: 12,
      nombre: 'CALENDARIO ADVIENTO BOMBONES LINDOR LINDT',
      categoria: 'navidad',
      referencia: 'NA-032-000',
      imagen: 'assets/images/NA-032-000.jpg',
      medidas: 'Medidas 250 x 250 x 30mm'
    },
    {
      id: 13,
      nombre: 'Estuche con Benjamín y Bombones Lindor',
      categoria: 'navidad',
      referencia: 'LOTE 003-01',
      imagen: 'assets/images/LOTE-003-01.jpg',
      medidas: 'Medidas 120 x 63 x 200 mm'
    },
    {
      id: 14,
      nombre: 'Galleta Artesana',
      categoria: 'galletas',
      referencia: 'FL-023',
      imagen: 'assets/images/FL-023.jpg',
      medidas: 'Medidas  5,4 x 4,5 cm'
    }
  ];

  constructor(
    private cartService: CartServiceService,
    private route: ActivatedRoute,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    this.producto = this.productos.find(p => p.id === +productId!);

    if (!this.producto) {
      console.error('Producto no encontrado');
      return;
    }

    // Obtener productos relacionados (excluyendo el producto actual)
    this.relatedProducts = this.productos
      .filter(p => p.id !== this.producto.id)
      .slice(0, 8); // Limitamos a 8 productos relacionados
  }

  ngAfterViewInit() {
    const swiperEl = this.swiper.nativeElement;

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
  }

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
}
