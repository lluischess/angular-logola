import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {

  constructor(private router: Router) {
    // Escuchar cambios de ruta y hacer scroll al top
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.scrollToTop();
    });
  }

  /**
   * Hacer scroll al top de la página
   */
  scrollToTop(): void {
    // Múltiples métodos para asegurar compatibilidad
    try {
      // Método 1: window.scrollTo (más compatible)
      window.scrollTo(0, 0);
      
      // Método 2: document.body.scrollTop (fallback)
      if (document.body.scrollTop !== 0) {
        document.body.scrollTop = 0;
      }
      
      // Método 3: document.documentElement.scrollTop (fallback)
      if (document.documentElement.scrollTop !== 0) {
        document.documentElement.scrollTop = 0;
      }
    } catch (error) {
      // Fallback silencioso si hay algún error
      console.warn('Error al hacer scroll al top:', error);
    }
  }

  /**
   * Hacer scroll suave al top
   */
  smoothScrollToTop(): void {
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    } catch (error) {
      // Fallback a scroll inmediato si smooth no está soportado
      this.scrollToTop();
    }
  }

  /**
   * Hacer scroll a un elemento específico
   */
  scrollToElement(elementId: string): void {
    try {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    } catch (error) {
      console.warn('Error al hacer scroll al elemento:', error);
    }
  }
}
