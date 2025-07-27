import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';  // Importa las rutas desde app.routes.ts
import { AuthInterceptor } from './shared/back/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), // Mantén la configuración de Zone.js
    provideRouter(routes),  // Configura el enrutamiento con tus rutas
    provideHttpClient(withInterceptorsFromDi()), // Configura HttpClient para comunicación con backend
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    } // Interceptor para manejo automático de tokens JWT
  ]
};
