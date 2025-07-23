import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private sidebarCollapsedSubject = new BehaviorSubject<boolean>(true);
  public sidebarCollapsed$ = this.sidebarCollapsedSubject.asObservable();

  constructor() { }

  /**
   * Obtener el estado actual del sidebar
   */
  get isCollapsed(): boolean {
    return this.sidebarCollapsedSubject.value;
  }

  /**
   * Alternar el estado del sidebar
   */
  toggleSidebar(): void {
    const currentState = this.sidebarCollapsedSubject.value;
    this.sidebarCollapsedSubject.next(!currentState);
  }

  /**
   * Cerrar el sidebar
   */
  closeSidebar(): void {
    this.sidebarCollapsedSubject.next(true);
  }

  /**
   * Abrir el sidebar
   */
  openSidebar(): void {
    this.sidebarCollapsedSubject.next(false);
  }

  /**
   * Establecer el estado del sidebar
   */
  setSidebarState(collapsed: boolean): void {
    this.sidebarCollapsedSubject.next(collapsed);
  }
}
