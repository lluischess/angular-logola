import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { register } from 'swiper/element/bundle';
import { CartServiceService } from '../shared/services/cart-service.service';

// Declarar Bootstrap para TypeScript
declare var bootstrap: any;


register(); // Register Swiper custom elements

@Component({
  selector: 'app-s-caramelos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './s-caramelos.component.html',
  styleUrls: ['./s-caramelos.component.css']
})
export class SCaramelosComponent implements AfterViewInit {
  @ViewChild('swiper') swiper!: ElementRef;

  constructor(private cartService: CartServiceService) {}


  ngAfterViewInit() {
    const swiperEl = this.swiper.nativeElement;
    const swiperParams = {
      slidesPerView: 4,
      spaceBetween: 30,
      navigation: {
        prevEl: '.caramelos-carousel-prev',
        nextEl: '.caramelos-carousel-next',
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
  }

  productos = [
    {
      id: 1,
      nombre: 'BOMBÓN NAVIDAD EN BOLSA UNITARIA PERSONALIZADA',
      referencia: 'BE-015-156',
      imagen: 'assets/images/BE-015-156.jpg',
      medidas: 'Medidas 72 x 59 mm'
    },
    {
      id: 2,
      nombre: 'Bote personalizado con Bolas de Cereales con Chocolate',
      referencia: 'EN-148',
      imagen: 'assets/images/EN-148.jpg',
      medidas: 'Medidas 72 x 59 mm'
    },
    {
      id: 3,
      nombre: 'Bote personalizado con Catanias',
      referencia: 'EN-134',
      imagen: 'assets/images/EN-134.jpg',
      medidas: 'Medidas 72 x 59 mm'
    },
    {
      id: 4,
      nombre: 'Catánias 35g en estuche Medium Faja',
      referencia: 'SS-201-003',
      imagen: 'assets/images/SS-201-003.jpg',
      medidas: 'Medidas 60 x 60 x 55 mm'
    },
    {
      id: 5,
      nombre: 'Bombon de Yogur y Fresa cubo medium',
      referencia: 'SS-202',
      imagen: 'assets/images/SS-202.jpg',
      medidas: 'Medidas  60 x 40 x 55 mm'
    },
    {
      id: 6,
      nombre: 'Chocolates Levels Piramid',
      referencia: 'CO-000',
      imagen: 'assets/images/CO-000.jpg',
      medidas: 'Medidas 13 x 13 x 9,5 cm'
    }
  ];

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
}
