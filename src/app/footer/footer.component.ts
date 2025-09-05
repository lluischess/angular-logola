import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguracionService, ConfiguracionCompleta } from '../services/configuracion.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit, OnDestroy {
  // Datos de configuración desde la BBDD
  public telefono: string = '(+34) 938 612 5568';
  public email: string = 'info@logolate.com';
  public direccion: string = 'La Garriga (Barcelona) Spain 08530';
  public horario: string = 'Lunes a Viernes de 9:00 a 18:00';
  public descripcion: string = 'En Logolate te ofrecemos chocolates personalizados de alta calidad...';
  public instagram: string = 'https://www.instagram.com/logolate_spain/';
  public logoFooter: string = 'assets/images/logo.png';

  // Estado de carga
  public isLoadingConfig: boolean = false;
  public configError: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(private configuracionService: ConfiguracionService) {}

  ngOnInit(): void {
    this.loadFooterConfiguration();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar configuración del footer desde la BBDD
   */
  private loadFooterConfiguration(): void {
    //console.log('🦶 [FOOTER] === CARGANDO CONFIGURACIÓN ===');
    this.isLoadingConfig = true;
    this.configError = false;

    this.configuracionService.getConfiguracion()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config: ConfiguracionCompleta) => {
          //console.log('🦶 [FOOTER] === CONFIGURACIÓN RECIBIDA DETALLADA ===');
          //console.log('🦶 [FOOTER] Configuración completa:', config);
          //console.log('🦶 [FOOTER] config.footer:', config.footer);
          //console.log('🦶 [FOOTER] config.general:', config.general);

          if (config) {
            // Mapear datos de contacto del footer con logging detallado
            if (config.footer) {
              //console.log('🦶 [FOOTER] === MAPEANDO DATOS DEL FOOTER ===');
              //console.log('  - config.footer.telefono:', config.footer.telefono);
              //console.log('  - config.footer.email:', config.footer.email);
              //console.log('  - config.footer.direccion:', config.footer.direccion);
              //console.log('  - config.footer.horario:', config.footer.horario);
              //console.log('  - config.footer.descripcion:', config.footer.descripcion);
              //console.log('  - config.footer.instagram:', config.footer.instagram);

              this.telefono = config.footer.telefono || this.telefono;
              this.email = config.footer.email || this.email;
              this.direccion = config.footer.direccion || this.direccion;
              this.horario = config.footer.horario || this.horario;
              this.descripcion = config.footer.descripcion || this.descripcion;
              this.instagram = config.footer.instagram || this.instagram;
            } else {
              console.warn('🦶 [FOOTER] config.footer es undefined o null');
            }

            // Mapear logo del footer desde configuración general
            if (config.general && config.general.logoFooter) {
              //console.log('🦶 [FOOTER] Logo footer encontrado:', config.general.logoFooter);
              this.logoFooter = config.general.logoFooter;
            } else {
              console.warn('🦶 [FOOTER] Logo footer no encontrado en config.general.logoFooter');
            }

            //console.log('🦶 [FOOTER] Datos aplicados:');
            //console.log('  - Teléfono:', this.telefono);
            //console.log('  - Email:', this.email);
            //console.log('  - Dirección:', this.direccion);
            //console.log('  - Horario:', this.horario);
            //console.log('  - Instagram:', this.instagram);
            //console.log('  - Logo Footer:', this.logoFooter);
          }

          this.isLoadingConfig = false;
        },
        error: (error: any) => {
          console.error('❌ [FOOTER] Error cargando configuración:', error);
          this.configError = true;
          this.isLoadingConfig = false;
          // Mantener valores por defecto en caso de error
        }
      });
  }

  /**
   * Obtener URL absoluta para el logo del footer
   */
  getLogoFooterUrl(): string {
    if (this.logoFooter.startsWith('http')) {
      return this.logoFooter;
    }
    return this.logoFooter;
  }
}
