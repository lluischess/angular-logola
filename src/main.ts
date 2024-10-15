import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';  // Importa la configuración de tu aplicación

// Bootstrap de la aplicación con la configuración y el enrutamiento
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
