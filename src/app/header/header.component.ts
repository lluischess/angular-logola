import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';  // Asegúrate de importar Router

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']  // Asegúrate de usar "styleUrls" en plural
})
export class HeaderComponent {

  searchQuery: string = '';

  constructor(private router: Router) { }  // Inyectar el Router

  onSearchSubmit(): void {
    if (this.searchQuery.trim()) {
      // Redirigir a la página del grid con el término de búsqueda como parámetro
      this.router.navigate(['/productos'], { queryParams: { search: this.searchQuery } });
    }
    // Desplazamiento automático hacia arriba
    window.scrollTo({
      top: 0
    });
  }

}
