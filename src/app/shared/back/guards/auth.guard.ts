import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {

    // Solo aplicar autenticación a rutas que contengan '/logoadmin/'
    if (!state.url.includes('/logoadmin/')) {
      //console.log('✅ Ruta pública, acceso permitido sin autenticación');
      return true;
    }

    // Para rutas de logoadmin, verificar autenticación
    // Verificar si hay una sesión válida localmente
    if (!this.authService.isAuthenticated()) {
      //console.log('❌ No hay sesión válida, redirigiendo al login');
      this.router.navigate(['/logoadmin/login']);
      return false;
    }

    // Verificar si el usuario es uno de los 4 administradores válidos
    if (!this.authService.isValidAdmin()) {
      //console.log('❌ Usuario no autorizado para acceder al backoffice');
      this.authService.logout();
      return false;
    }

    // Verificar token con el backend para asegurar que sigue siendo válido
    return this.authService.checkToken().pipe(
      map((response) => {
        //console.log('✅ Token válido, acceso permitido');
        return true;
      }),
      catchError((error) => {
        //console.log('❌ Token inválido, redirigiendo al login:', error.message);
        this.router.navigate(['/logoadmin/login']);
        return of(false);
      })
    );
  }
}
