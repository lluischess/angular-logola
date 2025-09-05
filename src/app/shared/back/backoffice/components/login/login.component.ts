import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

/**
 * Componente de login para el backoffice
 * Maneja la autenticación de usuarios administradores
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    // Inicializar formulario reactivo con validaciones
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Alternar visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  /**
   * Manejar envío del formulario de login
   */
  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      const { username, password } = this.loginForm.value;

      // Usar AuthService integrado con backend NestJS
      this.authService.login(username, password).subscribe({
        next: (response) => {
          //console.log('✅ Login exitoso con backend:', response.user.name);

          // Verificar que sea uno de los 4 usuarios administradores válidos
          if (this.authService.isValidAdmin()) {
            // Redirigir al dashboard
            this.router.navigate(['/logoadmin/dashboard']);
          } else {
            this.errorMessage = 'Usuario no autorizado para acceder al backoffice.';
            this.authService.logout();
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error en login:', error.message);
          this.errorMessage = error.message || 'Error de autenticación. Verifique sus credenciales.';
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * Verificar si un campo tiene errores
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.loginForm.get(fieldName);
    return field ? field.hasError(errorType) && field.touched : false;
  }
}
