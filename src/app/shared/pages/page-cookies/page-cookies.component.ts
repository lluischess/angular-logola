import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../../services/seo.service';

@Component({
  selector: 'app-page-cookies',
  standalone: true,
  imports: [],
  templateUrl: './page-cookies.component.html',
  styleUrl: './page-cookies.component.css'
})
export class PageCookiesComponent implements OnInit {
  public email: string = 'info@logolate.com';

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.updateSeoMetadata({
      title: 'Política de Cookies - Logolate',
      description: 'Consulta la política de cookies de Logolate. Información sobre el uso de cookies en nuestra web de chocolates y bombones personalizados.',
      keywords: 'política cookies, logolate, cookies web',
      ogTitle: 'Política de Cookies - Logolate',
      ogDescription: 'Consulta la política de cookies de Logolate. Información sobre el uso de cookies en nuestra web.',
      canonical: this.seoService.buildCanonicalUrl('/politica-de-cookies')
    });
  }
}
