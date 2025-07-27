import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Interceptor para manejo automático de tokens JWT
 * Añade automáticamente el token de autorización a las peticiones HTTP
 * Maneja errores de autenticación de forma centralizada
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener el token de autenticación
    const token = this.authService.getToken();

    // Clonar la petición y añadir el header de autorización si existe el token
    let authRequest = request;
    if (token) {
      authRequest = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${token}`)
      });
    }

    // Procesar la petición y manejar errores de autenticación
    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si es un error 401 (No autorizado), limpiar sesión y redirigir al login
        if (error.status === 401) {
          console.log('🔒 Token expirado o inválido, cerrando sesión...');
          this.authService.logout();
          this.router.navigate(['/logoadmin/login']);
        }

        // Si es un error 403 (Prohibido), mostrar mensaje de acceso denegado
        if (error.status === 403) {
          console.log('❌ Acceso denegado');
        }

        return throwError(() => error);
      })
    );
  }
}
