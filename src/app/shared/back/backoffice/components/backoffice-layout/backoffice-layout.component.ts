import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BackofficeSidebarComponent } from '../shared/backoffice-sidebar/backoffice-sidebar.component';
import { BackofficeHeaderComponent } from '../shared/backoffice-header/backoffice-header.component';

@Component({
  selector: 'app-backoffice-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BackofficeSidebarComponent,
    BackofficeHeaderComponent
  ],
  templateUrl: './backoffice-layout.component.html',
  styleUrls: ['./backoffice-layout.component.css']
})
export class BackofficeLayoutComponent {
  @Input() pageTitle: string = '';
  @Input() breadcrumbs: Array<{label: string, route?: string}> = [];
  @ViewChild(BackofficeSidebarComponent) sidebarComponent!: BackofficeSidebarComponent;

  constructor() {
    // Inicialización del componente de layout
    //console.log('BackofficeLayoutComponent inicializado');
  }

  // Método para toggle del sidebar - estructura exacta del dashboard
  toggleSidebar = (): void => {
    if (this.sidebarComponent) {
      this.sidebarComponent.toggleSidebar();
    }
  }
}
