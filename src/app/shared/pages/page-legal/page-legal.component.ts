import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../../services/seo.service';

@Component({
  selector: 'app-page-legal',
  standalone: true,
  imports: [],
  templateUrl: './page-legal.component.html',
  styleUrl: './page-legal.component.css'
})
export class PageLegalComponent implements OnInit {
  public email = 'info@logolate.com';

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.updateSeoMetadata({
      title: 'Aviso Legal - Logolate',
      description: 'Aviso legal de Logolate S.L. Información legal sobre el titular del sitio web de chocolates y bombones personalizados para hoteles y empresas.',
      keywords: 'aviso legal, logolate, información legal',
      ogTitle: 'Aviso Legal - Logolate',
      ogDescription: 'Aviso legal de Logolate S.L. Información legal sobre el titular del sitio web.',
      canonical: this.seoService.buildCanonicalUrl('/aviso-legal')
    });
  }
}
