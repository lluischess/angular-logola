import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { CategoriesService, FrontCategory } from '../services/categories.service';
import { ConfiguracionService, ConfiguracionCompleta } from '../services/configuracion.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  // Propiedades para la búsqueda
  searchQuery: string = '';
  private searchSubject = new Subject<string>();
  
  // Propiedades para categorías dinámicas
  categories: FrontCategory[] = [];
  isLoadingCategories = false;
  categoriesError = false;
  
  // Propiedades para configuración dinámica
  logoHeader: string = 'assets/images/logo.png';
  isLoadingConfig = false;
  configError = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private categoriesService: CategoriesService,
    private configuracionService: ConfiguracionService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadHeaderConfiguration();
    this.setupReactiveSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar configuración del header desde la BBDD
   */
  private loadHeaderConfiguration(): void {
    console.log('🏠 [HEADER] === CARGANDO CONFIGURACIÓN ===');
    this.isLoadingConfig = true;
    this.configError = false;

    this.configuracionService.getConfiguracion()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config: ConfiguracionCompleta) => {
          console.log('🏠 [HEADER] Configuración recibida:', config);
          
          if (config && config.general && config.general.logoHeader) {
            this.logoHeader = config.general.logoHeader;
            console.log('🏠 [HEADER] Logo del header actualizado:', this.logoHeader);
          }
          
          this.isLoadingConfig = false;
        },
        error: (error: any) => {
          console.error('❌ [HEADER] Error cargando configuración:', error);
          this.configError = true;
          this.isLoadingConfig = false;
          // Mantener logo por defecto en caso de error
        }
      });
  }

  /**
   * Carga las categorías desde el backend
   */
  private loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoriesError = false;

    this.categoriesService.getPublishedCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoadingCategories = false;
        console.log('✅ Categorías cargadas en header desktop:', categories);
      },
      error: (error) => {
        console.error('❌ Error cargando categorías en header desktop:', error);
        this.categoriesError = true;
        this.isLoadingCategories = false;
        // Usar categorías por defecto como fallback
        this.categories = this.categoriesService.getDefaultCategories();
      }
    });
  }

  /**
   * Genera la URL para una categoría
   */
  getCategoryUrl(category: FrontCategory): string {
    return `/productos/${category.slug}`;
  }

  /**
   * Obtiene el título del menú para una categoría
   */
  getCategoryMenuTitle(category: FrontCategory): string {
    // Usar metaTitle si existe, sino crear uno basado en el nombre
    if (category.metaTitulo) {
      return category.metaTitulo;
    }
    return `Catálogo de ${category.nombre}`;
  }

  /**
   * TrackBy function para optimizar el renderizado
   */
  trackByCategory(index: number, category: FrontCategory): string {
    return category._id;
  }

  /**
   * Configurar búsqueda reactiva con debounce
   */
  private setupReactiveSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(500), // Esperar 500ms después de que el usuario deje de escribir
        distinctUntilChanged(), // Solo navegar si el término cambió
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        if (searchTerm.trim().length >= 2) {
          // Navegar a /productos con el término de búsqueda
          this.router.navigate(['/productos'], { 
            queryParams: { search: searchTerm.trim() },
            queryParamsHandling: 'merge' // Mantener otros query params si existen
          });
        } else if (searchTerm.trim().length === 0) {
          // Si se borra la búsqueda, navegar a /productos sin parámetros de búsqueda
          this.router.navigate(['/productos']);
        }
      });
  }

  /**
   * Manejar cambios en el input de búsqueda (búsqueda reactiva)
   */
  onSearchInput(): void {
    // Emitir el término de búsqueda al Subject para navegación reactiva
    this.searchSubject.next(this.searchQuery);
  }

  /**
   * Manejar evento blur del input de búsqueda
   */
  onSearchBlur(): void {
    // No hacer nada por ahora
  }

  /**
   * Enviar búsqueda - navegar a /productos con el término
   */
  onSearchSubmit(): void {
    if (this.searchQuery.trim()) {
      // Redirigir a la página del grid con el término de búsqueda como parámetro
      this.router.navigate(['/productos'], { queryParams: { search: this.searchQuery.trim() } });
    }
    // Desplazamiento automático hacia arriba
    window.scrollTo({
      top: 0
    });
  }

  /**
   * Obtener URL absoluta para el logo del header
   */
  getLogoHeaderUrl(): string {
    if (this.logoHeader.startsWith('http')) {
      return this.logoHeader;
    }
    return this.logoHeader;
  }

}
