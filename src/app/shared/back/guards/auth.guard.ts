import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Verificar si existe un token de autenticación en localStorage
    const token = localStorage.getItem('authToken');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    // Si existe el token o está marcado como logueado, permitir acceso
    if (token || isLoggedIn === 'true') {
      return true;
    }
    
    // Si no está autenticado, redirigir al login
    this.router.navigate(['/logoadmin/login']);
    return false;
  }
}
