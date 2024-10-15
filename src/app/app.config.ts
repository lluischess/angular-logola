import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';  // Importa las rutas desde app.routes.ts

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), // Mantén la configuración de Zone.js
    provideRouter(routes)  // Configura el enrutamiento con tus rutas
  ]
};
