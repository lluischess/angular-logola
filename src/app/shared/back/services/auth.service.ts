import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { LoginRequest, LoginResponse, User, TokenValidationResponse, AuthError } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidSession());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private apiUrl = environment.apiUrl;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  /**
   * Verificar si existe una sesión válida
   */
  private hasValidSession(): boolean {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    return !!(token && user);
  }

  /**
   * Realizar login con el backend NestJS
   */
  login(username: string, password: string): Observable<LoginResponse> {
    const loginData: LoginRequest = {
      email: username, // El backend espera 'email' pero acepta nombres de usuario
      password: password
    };

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, loginData)
      .pipe(
        tap((response: LoginResponse) => {
          // Guardar datos de autenticación en localStorage
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          localStorage.setItem('username', response.user.name);
          
          // Actualizar estado de autenticación
          this.isAuthenticatedSubject.next(true);
          
          console.log('✅ Login exitoso:', response.user.name);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Verificar token con el backend
   */
  checkToken(): Observable<TokenValidationResponse> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    const headers = {
      'Authorization': `Bearer ${token}`
    };

    return this.http.get<TokenValidationResponse>(`${this.apiUrl}/auth/check-token`, { headers })
      .pipe(
        tap((response: TokenValidationResponse) => {
          // Actualizar datos del usuario si es necesario
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          localStorage.setItem('username', response.user.name);
          this.isAuthenticatedSubject.next(true);
        }),
        catchError((error) => {
          // Si el token no es válido, limpiar sesión
          this.clearSession();
          return throwError(() => error);
        })
      );
  }

  /**
   * Realizar logout
   */
  logout(): void {
    this.clearSession();
    this.router.navigate(['/logoadmin/login']);
    console.log('🚪 Logout realizado');
  }

  /**
   * Limpiar sesión local
   */
  private clearSession(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('username');
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.hasValidSession();
  }

  /**
   * Obtener el usuario actual
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Obtener el token JWT actual
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Obtener el nombre de usuario actual
   */
  getCurrentUsername(): string | null {
    return localStorage.getItem('username');
  }

  /**
   * Verificar si el usuario es uno de los 4 administradores permitidos
   */
  isValidAdmin(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const validAdmins = ['lluisadmin', 'jordiadmin', 'annaadmin', 'invitadoadmin'];
    return validAdmins.includes(user.email);
  }

  /**
   * Manejar errores de autenticación
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Error de autenticación';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      switch (error.status) {
        case 401:
          errorMessage = 'Usuario o contraseña incorrectos';
          break;
        case 403:
          errorMessage = 'Acceso denegado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.error?.message || 'Error desconocido'}`;
      }
    }
    
    console.error('❌ Error de autenticación:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
