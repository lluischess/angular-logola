import { Routes } from '@angular/router';
import { PageCookiesComponent } from './shared/pages/page-cookies/page-cookies.component';
import { PageCatalogeComponent } from './shared/pages/page-cataloge/page-cataloge.component';
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
    path: 'catalogos',
    component: PageCatalogeComponent
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
    path: 'productos',
    component: PageGridComponent
  },
  {
    path: 'productos/:categoria',
    component: PageGridComponent
  },
  {
    path: 'producto/:slug',
    component: PageProductComponent
  },
  {
    path: 'logoadmin',
    loadChildren: () => import('./shared/back/backoffice/backoffice.module').then(m => m.BackofficeModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./shared/back/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '**',  // Ruta para cualquier URL no encontrada
    redirectTo: '',
    pathMatch: 'full'
  }
];
