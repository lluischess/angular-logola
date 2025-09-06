import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';  // Importa las rutas desde app.routes.ts
import { AuthInterceptor } from './shared/back/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), // Mantén la configuración de Zone.js
    provideRouter(routes, 
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),  // Configura el enrutamiento con scroll automático al top
    provideHttpClient(withInterceptorsFromDi()), // Configura HttpClient para comunicación con backend
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    } // Interceptor para manejo automático de tokens JWT
  ]
};
