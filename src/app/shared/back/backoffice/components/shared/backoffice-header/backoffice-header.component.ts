import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-backoffice-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './backoffice-header.component.html',
  styleUrl: './backoffice-header.component.css'
})
export class BackofficeHeaderComponent implements OnInit {
  @Input() pageTitle: string = '';
  @Input() toggleSidebar!: () => void;
  
  private authService = inject(AuthService);
  
  currentUser: any = null;

  ngOnInit() {
    this.loadUserData();
  }

  private loadUserData(): void {
    const username = this.authService.getCurrentUsername();
    if (username) {
      this.currentUser = {
        username: username,
        role: 'Administrador'
      };
    } else {
      // Fallback si no hay usuario logueado
      this.currentUser = {
        username: 'Admin',
        role: 'Administrador'
      };
    }
  }
}
