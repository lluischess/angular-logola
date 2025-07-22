import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidSession());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private router: Router) {}

  /**
   * Verificar si existe una sesión válida
   */
  private hasValidSession(): boolean {
    const token = localStorage.getItem('authToken');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    return !!(token || isLoggedIn === 'true');
  }

  /**
   * Realizar login (versión básica)
   */
  login(username: string, password: string): boolean {
    // TODO: Aquí se integrará con el backend
    // Por ahora, validación básica para desarrollo
    if (username && password) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('authToken', 'temp-token-' + Date.now());
      localStorage.setItem('username', username);
      this.isAuthenticatedSubject.next(true);
      return true;
    }
    return false;
  }

  /**
   * Realizar logout
   */
  logout(): void {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/logoadmin/login']);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.hasValidSession();
  }

  /**
   * Obtener el nombre de usuario actual
   */
  getCurrentUser(): string | null {
    return localStorage.getItem('username');
  }
}
