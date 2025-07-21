import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
    private router: Router
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

      // Simular autenticación (sin backend por ahora)
      setTimeout(() => {
        if (username === 'admin' && password === 'admin123') {
          // Login exitoso
          console.log('Login exitoso');
          
          // Guardar token simulado en localStorage
          localStorage.setItem('backoffice_token', 'fake-jwt-token');
          localStorage.setItem('backoffice_user', JSON.stringify({
            username: username,
            role: 'admin',
            loginTime: new Date().toISOString()
          }));
          
          // Redirigir al dashboard
          this.router.navigate(['/logoadmin/dashboard']);
        } else {
          // Login fallido
          this.errorMessage = 'Credenciales incorrectas. Verifique usuario y contraseña.';
        }
        
        this.isLoading = false;
      }, 1500); // Simular delay de red
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
