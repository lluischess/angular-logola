import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.css'
})
export class BannerComponent {
  currentSlide: number = 0;
  offset: number = 0;
  intervalId: any;

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  startAutoSlide() {
    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 25000);
  }

  nextSlide() {
    this.currentSlide += 1;

    // Cuando llegamos al final, regresamos al primer slide
    if (this.currentSlide >= 2) {
        this.currentSlide = 0;
    }

    // Ajusta el desplazamiento en función del número de slide actual
    this.offset = -this.currentSlide * 50;
}

prevSlide() {
    this.currentSlide -= 1;

    // Cuando llegamos al primer slide, volvemos al último
    if (this.currentSlide < 0) {
        this.currentSlide = 1;
    }

    // Ajusta el desplazamiento en función del número de slide actual
    this.offset = -this.currentSlide * 50;
}
}
