import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CategoriesService, FrontCategory } from '../services/categories.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']  // Asegúrate de usar "styleUrls" en plural
})
export class HeaderComponent implements OnInit {

  searchQuery: string = '';
  
  // Propiedades para categorías dinámicas
  categories: FrontCategory[] = [];
  isLoadingCategories = false;
  categoriesError = false;

  constructor(
    private router: Router,
    private categoriesService: CategoriesService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
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
    if (category.seo?.metaTitle) {
      return category.seo.metaTitle;
    }
    return `Catálogo de ${category.nombre}`;
  }

  /**
   * TrackBy function para optimizar el renderizado
   */
  trackByCategory(index: number, category: FrontCategory): string {
    return category._id;
  }

  onSearchSubmit(): void {
    if (this.searchQuery.trim()) {
      // Redirigir a la página del grid con el término de búsqueda como parámetro
      this.router.navigate(['/productos'], { queryParams: { search: this.searchQuery } });
    }
    // Desplazamiento automático hacia arriba
    window.scrollTo({
      top: 0
    });
  }

}
