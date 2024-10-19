import { Routes } from '@angular/router';
import { PageCookiesComponent } from './shared/pages/page-cookies/page-cookies.component';
import { PageLegalComponent } from './shared/pages/page-legal/page-legal.component';
import { PageTermsComponent } from './shared/pages/page-terms/page-terms.component';
import { PageHomeComponent } from './pages/page-home/page-home.component';
import { PageGridComponent } from './pages/page-grid/page-grid.component';
import { PageProductComponent } from './pages/page-product/page-product.component';

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
    path: 'chocolates',
    component: PageGridComponent
  },
  {
    path: 'producto',
    component: PageProductComponent
  },
  {
    path: '**',  // Ruta para cualquier URL no encontrada
    redirectTo: '',
    pathMatch: 'full'
  }
];
