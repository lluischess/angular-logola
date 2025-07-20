import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CartServiceService } from '../../shared/services/cart-service.service';

// Declarar Bootstrap para TypeScript
declare var bootstrap: any;

@Component({
  selector: 'app-page-grid',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './page-grid.component.html',
  styleUrl: './page-grid.component.css'
})
export class PageGridComponent {
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

  productosFiltrados: any[] = []; // Productos filtrados según la categoría y/o búsqueda
  categoriaSeleccionada: string = ''; // Categoría actual
  searchQuery: string = '';  // Término de búsqueda

  constructor(private route: ActivatedRoute, private cartService: CartServiceService) {}

  ngOnInit(): void {
    // Escuchar cambios en los parámetros de la URL (categoría y búsqueda)
    this.route.paramMap.subscribe(params => {
      this.categoriaSeleccionada = params.get('categoria') || ''; // Obtener la categoría
      this.filtrarProductos(); // Filtrar productos cuando cambia la categoría
    });

    // Escuchar cambios en los queryParams (búsqueda)
    this.route.queryParams.subscribe(queryParams => {
      this.searchQuery = queryParams['search'] || '';  // Obtener el término de búsqueda
      this.filtrarProductos(); // Filtrar productos cuando cambia el término de búsqueda
    });
  }

  // Función para filtrar productos por categoría y búsqueda
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
