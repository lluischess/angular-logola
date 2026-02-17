import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../../services/seo.service';

@Component({
  selector: 'app-page-terms',
  standalone: true,
  imports: [],
  templateUrl: './page-terms.component.html',
  styleUrl: './page-terms.component.css'
})
export class PageTermsComponent implements OnInit {
  public email: string = 'info@logolate.com';

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.updateSeoMetadata({
      title: 'Términos y Condiciones - Logolate',
      description: 'Términos y condiciones de compra de Logolate. Condiciones generales para pedidos de chocolates y bombones personalizados para hoteles y empresas.',
      keywords: 'términos condiciones, condiciones compra, logolate',
      ogTitle: 'Términos y Condiciones - Logolate',
      ogDescription: 'Términos y condiciones de compra de Logolate para pedidos de chocolates personalizados.',
      canonical: this.seoService.buildCanonicalUrl('/terminos-y-condiciones')
    });
  }
}
