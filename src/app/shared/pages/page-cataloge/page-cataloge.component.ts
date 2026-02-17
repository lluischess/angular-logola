import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { SeoService } from '../../../services/seo.service';

interface Catalogo {
  titulo: string;
  iframeSrc: string;
  pdfPath: string;
}

@Component({
  selector: 'app-page-cataloge',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './page-cataloge.component.html',
  styleUrl: './page-cataloge.component.css'
})
export class PageCatalogeComponent implements OnInit {
  catalogos: Catalogo[] = [
    {
      titulo: 'Catálogo Navidad 2025',
      iframeSrc: 'https://heyzine.com/flip-book/3c5b83ba5f.html',
      pdfPath: 'assets/pdfs/catalogo_navidad_2025.pdf'
    },
    {
      titulo: 'Catálogo Productos a Medida para Hoteles',
      iframeSrc: 'https://heyzine.com/flip-book/4459912889.html',
      pdfPath: 'assets/pdfs/Catalogo_productos_medida.pdf'
    },
    {
      titulo: 'Catálogo Productos con Encanto para Hoteles',
      iframeSrc: 'https://heyzine.com/flip-book/23cab364f5.html',
      pdfPath: 'assets/pdfs/CATALOGO_LOGOLATE_HOTELES.pdf'
    },
    {
      titulo: 'Catálogo Productos Mini Bar',
      iframeSrc: 'https://heyzine.com/flip-book/7494c609ed.html',
      pdfPath: 'assets/pdfs/CATALOGO_MINI_BAR.pdf'
    },
    {
      titulo: 'Catálogo Caramelos',
      iframeSrc: 'https://heyzine.com/flip-book/6d4caf4582.html',
      pdfPath: 'assets/pdfs/CATALOGO_CARAMELOS.pdf'
    }
  ];

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.updateSeoMetadata({
      title: 'Catálogos de Chocolates Personalizados - Logolate',
      description: 'Descarga los catálogos de Logolate: chocolates para hoteles, amenities personalizados, caramelos, mini bar y regalos de Navidad corporativos.',
      keywords: 'catálogo chocolates personalizados, catálogo hoteles, amenities chocolate, catálogo navidad corporativo',
      ogTitle: 'Catálogos de Chocolates Personalizados - Logolate',
      ogDescription: 'Descarga los catálogos de chocolates y bombones personalizados de Logolate para hoteles, empresas y eventos.',
      canonical: this.seoService.buildCanonicalUrl('/catalogos')
    });
  }

  descargarCatalogo(pdfPath: string, titulo: string): void {
    const link = document.createElement('a');
    link.href = pdfPath;
    link.download = titulo.replace(/\s+/g, '_') + '.pdf';
    link.click();
  }
}
