import { Routes } from '@angular/router';
import { PageCookiesComponent } from './shared/pages/page-cookies/page-cookies.component';
import { PageLegalComponent } from './shared/pages/page-legal/page-legal.component';
import { PageTermsComponent } from './shared/pages/page-terms/page-terms.component';
import { PageHomeComponent } from './pages/page-home/page-home.component';

export const routes: Routes = [
  {
    path: '',
    component: PageHomeComponent
  },
  {
    path: 'politica-de-cookies',
    component: PageCookiesComponent
  },
  {
    path: 'aviso-legal',
    component: PageLegalComponent
  },
  {
    path: 'terminos-y-condiciones',
    component: PageTermsComponent
  },
  {
    path: '**',  // Ruta para cualquier URL no encontrada
    redirectTo: '',
    pathMatch: 'full'
  }
];
