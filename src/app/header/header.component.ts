import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  searchQuery: string = '';

  onSearchSubmit(): void {
    console.log('Searching for:', this.searchQuery);
    // Aquí podrías agregar la lógica para enviar la búsqueda
  }

}
