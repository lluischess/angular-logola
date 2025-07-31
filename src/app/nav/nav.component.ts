import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoriesService, FrontCategory } from '../services/categories.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent implements OnInit {
  categories: FrontCategory[] = [];
  isLoadingCategories = true;
  categoriesError = false;

  constructor(private categoriesService: CategoriesService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * Cargar categorías publicadas del backend
   */
  private loadCategories(): void {
    console.log('🔄 [NAV] Cargando categorías del backend...');
    this.isLoadingCategories = true;
    this.categoriesError = false;

    // Usar el servicio de categorías
    this.categoriesService.getPublishedCategories()
      .subscribe({
        next: (categories) => {
          console.log('✅ [NAV] Categorías obtenidas:', categories);
          this.categories = categories;
          this.isLoadingCategories = false;
        },
        error: (error) => {
          console.error('❌ [NAV] Error cargando categorías:', error);
          this.categoriesError = true;
          this.isLoadingCategories = false;
          this.categories = [];
        }
      });
  }

  /**
   * Obtener el título del menú para una categoría
   */
  getCategoryMenuTitle(category: FrontCategory): string {
    return this.categoriesService.getCategoryMenuTitle(category);
  }

  /**
   * Obtener la URL de la categoría
   */
  getCategoryUrl(category: FrontCategory): string {
    return this.categoriesService.getCategoryUrl(category);
  }



  /**
   * TrackBy function para optimizar el renderizado del ngFor
   */
  trackByCategory(index: number, category: FrontCategory): string {
    return category._id;
  }
}
