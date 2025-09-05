import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BackofficeLayoutComponent } from '../backoffice-layout/backoffice-layout.component';
import { Presupuesto, ProductoPresupuesto } from '../presupuestos/presupuestos.component';
import { BudgetsService, Budget, BudgetStatus } from '../../../services/budgets.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-presupuesto-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BackofficeLayoutComponent],
  templateUrl: './presupuesto-detalle.component.html',
  styleUrls: ['./presupuesto-detalle.component.css']
})
export class PresupuestoDetalleComponent implements OnInit {
  // Estado del componente
  isLoading = false;
  presupuesto: Presupuesto | null = null;

  // Estado de edición de apuntes
  editingNotes = false;
  tempNotes = '';

  // Estado de edición del presupuesto
  isEditMode = false;
  originalPresupuesto: Presupuesto | null = null;
  editingProduct: { [key: string]: boolean } = {};
  isSaving = false;

  // Usuario actual
  currentUser: any = null;

  // Propiedades del menú eliminadas - ahora usa el layout reutilizable

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private budgetsService: BudgetsService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadPresupuesto();
  }

  private loadPresupuesto(): void {
    const numeroPresupuestoStr = this.route.snapshot.paramMap.get('id');
    if (numeroPresupuestoStr) {
      this.isLoading = true;
      const numeroPresupuesto = parseInt(numeroPresupuestoStr);

      //console.log('🔍 DEBUG: Cargando presupuesto ENRIQUECIDO con numeroPresupuesto:', numeroPresupuesto);

      // Usar endpoint enriquecido para obtener datos completos de productos
      this.budgetsService.getBudgetByNumberEnriched(numeroPresupuesto).subscribe({
        next: (budget) => {
          //console.log('✅ DEBUG: Presupuesto ENRIQUECIDO obtenido:', budget);
          //console.log('🔍 DEBUG: Productos en presupuesto enriquecido:', budget.productos);
          budget.productos?.forEach((prod, i) => {
            // console.log(`📦 DEBUG: Producto ${i+1}:`, {
            //   productoId: prod.productoId,
            //   cantidad: prod.cantidad,
            //   precioUnitario: prod.precioUnitario,
            //   producto: prod.producto,
            //   imagen: prod.producto?.imagen
            // });
          });
          this.presupuesto = this.convertEnrichedBudgetToPresupuesto(budget);
          //console.log('🎯 DEBUG: Presupuesto convertido para frontend:', this.presupuesto);
          // console.log('🖼️ DEBUG: Imágenes de productos en frontend:',
          //   this.presupuesto.productos.map(p => ({ nombre: p.nombre, imagen: p.imagen })));
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ DEBUG: Error cargando presupuesto enriquecido:', error);
          console.error('❌ DEBUG: Status del error:', error.status);
          console.error('❌ DEBUG: Mensaje del error:', error.message);
          //console.log('🔄 DEBUG: FALLBACK - Intentando con método tradicional...');

          // Fallback: usar método tradicional si el enriquecido falla
          this.budgetsService.getBudgets({ limit: 100 }).subscribe({
            next: (response) => {
              const budgets = response.budgets || response;
              const budget = budgets.find((b: any) => b.numeroPresupuesto === numeroPresupuesto);

              if (budget) {
                //console.log('✅ DEBUG: Presupuesto encontrado (fallback):', budget);
                //console.log('📦 DEBUG: Productos en fallback:', budget.productos);
                budget.productos?.forEach((prod, i) => {
                  // console.log(`📦 DEBUG: Producto ${i+1} (fallback):`, {
                  //   productoId: prod.productoId,
                  //   cantidad: prod.cantidad,
                  //   precioUnitario: prod.precioUnitario,
                  //   tieneProductoEnriquecido: !!prod.producto,
                  //   imagenProducto: prod.producto?.imagen || 'SIN IMAGEN EN PRODUCTO ENRIQUECIDO'
                  // });
                });
                this.presupuesto = this.convertBudgetToPresupuesto(budget);
                //console.log('🎯 DEBUG: Presupuesto convertido (fallback):', this.presupuesto);
                // console.log('🖼️ DEBUG: Imágenes finales (fallback):',
                //   this.presupuesto.productos.map(p => ({ nombre: p.nombre, imagen: p.imagen })));
              } else {
                console.error('❌ DEBUG: Presupuesto no encontrado:', numeroPresupuesto);
                this.presupuesto = null;
              }
              this.isLoading = false;
            },
            error: (fallbackError) => {
              console.error('❌ DEBUG: Error en fallback:', fallbackError);
              this.isLoading = false;
              this.presupuesto = null;
            }
          });
        }
      });
    } else {
      this.router.navigate(['/logoadmin/presupuestos']);
    }
  }

  private getMockPresupuesto(id: string): Presupuesto | null {
    // Datos mock completos (en producción vendría de un servicio)
    const presupuestos: Presupuesto[] = [
      {
        id: '1001',
        numeroPresupuesto: 1,
        numeroPedido: 'LOG-240115-001',
        nombreEmpresa: 'Dulces Barcelona S.L.',
        nombreContacto: 'María García López',
        email: 'pedidos@dulcesbarcelona.com',
        telefono: '+34 932 123 456',
        direccion: 'Carrer de Balmes, 123, 08008 Barcelona',
        fecha: new Date('2024-01-15'),
        estado: 'pendiente',
        productos: [
          { id: '1', nombre: 'Chocolates Premium', categoria: 'Chocolates', cantidad: 100, precioUnitario: 12.50, precioTotal: 1250, imagen: '/assets/images/chocolate-premium.jpg' },
          { id: '2', nombre: 'Caramelos Artesanales', categoria: 'Caramelos', cantidad: 150, precioUnitario: 8.00, precioTotal: 1200, imagen: '/assets/images/caramelos-artesanales.jpg' }
        ],
        logoEmpresa: '/assets/images/logos/dulces-barcelona.jpg',
        aceptaCorreosPublicitarios: true,
        cantidadTotal: 250,
        apuntes: 'Cliente recurrente. Prefiere entregas los martes. Solicita facturación a final de mes.'
      },
      {
        id: '1002',
        numeroPresupuesto: 2,
        numeroPedido: 'LOG-240116-001',
        nombreEmpresa: 'Chocolates Madrid',
        nombreContacto: 'Carlos Rodríguez Sánchez',
        email: 'info@chocolatesmadrid.es',
        telefono: '+34 915 987 654',
        direccion: 'Calle Gran Vía, 45, 28013 Madrid',
        fecha: new Date('2024-01-16'),
        estado: 'aprobado',
        productos: [
          { id: '3', nombre: 'Bombones Gourmet', categoria: 'Chocolates', cantidad: 80, precioUnitario: 15.00, precioTotal: 1200, imagen: '/assets/images/bombones-gourmet.jpg' },
          { id: '4', nombre: 'Trufas de Chocolate', categoria: 'Chocolates', cantidad: 100, precioUnitario: 10.00, precioTotal: 1000, imagen: '/assets/images/trufas-chocolate.jpg' }
        ],
        logoEmpresa: '/assets/images/logos/chocolates-madrid.jpg',
        aceptaCorreosPublicitarios: false,
        cantidadTotal: 180,
        apuntes: 'Empresa premium. Requiere embalaje especial y certificado de calidad.'
      },
      {
        id: '1003',
        numeroPresupuesto: 3,
        numeroPedido: 'LOG-240117-001',
        nombreEmpresa: 'Caramelos Valencia',
        nombreContacto: 'Ana Martínez Pérez',
        email: 'compras@caramelosvalencia.com',
        telefono: '+34 963 456 789',
        direccion: 'Avenida del Puerto, 78, 46023 Valencia',
        fecha: new Date('2024-01-17'),
        estado: 'pendiente',
        productos: [
          { id: '5', nombre: 'Caramelos de Frutas', categoria: 'Caramelos', cantidad: 200, precioUnitario: 6.50, precioTotal: 1300, imagen: '/assets/images/caramelos-frutas.jpg' },
          { id: '6', nombre: 'Gominolas Artesanales', categoria: 'Gominolas', cantidad: 120, precioUnitario: 9.00, precioTotal: 1080, imagen: '/assets/images/gominolas-artesanales.jpg' }
        ],
        logoEmpresa: '/assets/images/logos/caramelos-valencia.jpg',
        aceptaCorreosPublicitarios: true,
        cantidadTotal: 320,
        apuntes: 'Nuevo cliente. Interesado en productos sin azúcar. Contactar antes del envío.'
      }
    ];

    // Buscar por numeroPresupuesto en lugar de ID
    const numeroPresupuesto = parseInt(id);
    return presupuestos.find(p => p.numeroPresupuesto === numeroPresupuesto) || null;
  }

  // Métodos de utilidad
  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'aprobado': return 'estado-aprobado';
      case 'rechazado': return 'estado-rechazado';
      case 'pendiente': return 'estado-pendiente';
      case 'enviado': return 'estado-enviado';
      default: return '';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'aprobado': return '✅';
      case 'rechazado': return '❌';
      case 'pendiente': return '⏳';
      case 'enviado': return '📧';
      default: return '❓';
    }
  }



  // Acciones de edición
  editarPresupuesto(): void {
    if (this.presupuesto) {
      //console.log('🔧 Activando modo edición para presupuesto:', this.presupuesto.numeroPresupuesto);
      this.isEditMode = true;
      // Crear copia de seguridad para poder cancelar
      this.originalPresupuesto = JSON.parse(JSON.stringify(this.presupuesto));
      this.editingProduct = {}; // Reset editing states
    }
  }

  guardarPresupuesto(): void {
    if (!this.presupuesto || this.isSaving) return;

    this.isSaving = true;
    //console.log('💾 Guardando cambios del presupuesto:', this.presupuesto.numeroPresupuesto);
    //console.log('🔍 Productos originales:', this.presupuesto.productos);

    // Preparar datos para enviar al backend con la estructura correcta del DTO
    const updateData: any = {
      productos: this.presupuesto.productos.map(prod => ({
        productId: prod.id, // ✅ Backend espera 'productId'
        nombre: prod.nombre,
        referencia: prod.referencia || `REF-${prod.id}`,
        cantidad: prod.cantidad,
        precioUnitario: prod.precioUnitario,
        subtotal: prod.cantidad * prod.precioUnitario
      })),
      cliente: {
        empresa: this.presupuesto.nombreEmpresa,
        nombre: this.presupuesto.nombreContacto,
        email: this.presupuesto.email,
        telefono: this.presupuesto.telefono,
        direccion: this.presupuesto.direccion,
        detalles: this.presupuesto.apuntes
      },
      estado: this.presupuesto.estado, // Usar estado literal directamente
      precioTotal: this.presupuesto.precioTotal || this.calculateTotal() // Corregido: usar precioTotal
    };

    //console.log('📤 Datos enviados al backend:', updateData);

    // Llamar al backend para actualizar
    this.budgetsService.updateBudget(this.presupuesto.id, updateData).subscribe({
      next: (response) => {
        //console.log('✅ Presupuesto actualizado exitosamente:', response);
        this.isEditMode = false;
        this.originalPresupuesto = null;
        this.editingProduct = {};
        this.isSaving = false;

        // Recargar datos enriquecidos directamente por ID para asegurar sincronización
        if (this.presupuesto?.id) {
          //console.log('🔄 Recargando presupuesto enriquecido por ID:', this.presupuesto.id);
          this.budgetsService.getBudgetEnriched(this.presupuesto.id).subscribe({
            next: (enrichedBudget: any) => {
              //console.log('✅ Presupuesto enriquecido recargado:', enrichedBudget);
              this.presupuesto = this.convertEnrichedBudgetToPresupuesto(enrichedBudget);
              //console.log('🎯 Presupuesto convertido tras guardar:', this.presupuesto);
            },
            error: (reloadError: any) => {
              console.error('❌ Error recargando presupuesto enriquecido:', reloadError);
              // Fallback: recargar con método normal
              this.loadPresupuesto();
            }
          });
        } else {
          // Si no hay ID, usar método normal
          this.loadPresupuesto();
        }
      },
      error: (error) => {
        console.error('❌ Error guardando presupuesto:', error);
        console.error('📋 Detalles del error completo:', error);
        console.error('📋 Error.error:', error.error);
        console.error('📋 Error.message:', error.message);
        console.error('📋 Error status:', error.status);
        this.isSaving = false;

        // Mensaje de error más específico
        let errorMessage = 'Error al guardar los cambios. Por favor, intenta de nuevo.';
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = `Error: ${error.error}`;
          } else if (error.error.message) {
            errorMessage = `Error: ${error.error.message}`;
          } else if (error.error.error) {
            errorMessage = `Error: ${error.error.error}`;
          }
        } else if (error.message) {
          errorMessage = `Error: ${error.message}`;
        }
        alert(errorMessage);
      }
    });
  }

  cancelarEdicion(): void {
    if (this.originalPresupuesto) {
      //console.log('🚫 Cancelando edición, restaurando datos originales');
      this.presupuesto = JSON.parse(JSON.stringify(this.originalPresupuesto));
    }
    this.isEditMode = false;
    this.originalPresupuesto = null;
    this.editingProduct = {};
  }

  // Métodos para edición de productos
  editarProducto(productoId: string): void {
    this.editingProduct[productoId] = true;
  }

  guardarProducto(productoId: string): void {
    if (this.presupuesto) {
      const producto = this.presupuesto.productos.find(p => p.id === productoId);
      if (producto) {
        // Recalcular total del producto
        producto.precioTotal = producto.cantidad * producto.precioUnitario;

        // Recalcular totales generales
        this.recalcularTotales();

        //console.log('✅ Producto actualizado:', producto);
      }
    }
    this.editingProduct[productoId] = false;
  }

  cancelarEdicionProducto(productoId: string): void {
    if (this.originalPresupuesto) {
      const productoOriginal = this.originalPresupuesto.productos.find(p => p.id === productoId);
      const productoActual = this.presupuesto?.productos.find(p => p.id === productoId);

      if (productoOriginal && productoActual) {
        productoActual.cantidad = productoOriginal.cantidad;
        productoActual.precioUnitario = productoOriginal.precioUnitario;
        productoActual.precioTotal = productoOriginal.precioTotal;
        this.recalcularTotales();
      }
    }
    this.editingProduct[productoId] = false;
  }

  eliminarProducto(productoId: string): void {
    if (this.presupuesto && confirm('¿Estás seguro de que quieres eliminar este producto del presupuesto?')) {
      this.presupuesto.productos = this.presupuesto.productos.filter(p => p.id !== productoId);
      this.recalcularTotales();
      //console.log('🗑️ Producto eliminado del presupuesto');
    }
  }

  private recalcularTotales(): void {
    if (this.presupuesto) {
      this.presupuesto.cantidadTotal = this.presupuesto.productos.reduce((sum, prod) => sum + prod.cantidad, 0);
      this.presupuesto.precioTotal = this.presupuesto.productos.reduce((sum, prod) => sum + prod.precioTotal, 0);
    }
  }

  // Métodos de utilidad para la edición
  isProductEditing(productoId: string): boolean {
    return !!this.editingProduct[productoId];
  }

  // Calcular total del presupuesto
  private calculateTotal(): number {
    if (!this.presupuesto || !this.presupuesto.productos) {
      return 0;
    }
    return this.presupuesto.productos.reduce((total, producto) => {
      return total + (producto.cantidad * producto.precioUnitario);
    }, 0);
  }

  // Mapear estado del frontend al backend
  private mapFrontendStatusToBackend(frontendStatus: string): BudgetStatus {
    const statusMap: { [key: string]: BudgetStatus } = {
      'pendiente': BudgetStatus.PENDIENTE,
      'aprobado': BudgetStatus.ACEPTADO,
      'rechazado': BudgetStatus.RECHAZADO,
      'enviado': BudgetStatus.ENVIADO,
      'en_proceso': BudgetStatus.EN_PROCESO,
      'vencido': BudgetStatus.VENCIDO
    };
    return statusMap[frontendStatus] || BudgetStatus.PENDIENTE;
  }

  cambiarEstado(nuevoEstado: 'pendiente' | 'aprobado' | 'rechazado' | 'enviado'): void {
    if (this.presupuesto) {
      this.presupuesto.estado = nuevoEstado;
      //console.log('Estado cambiado a:', nuevoEstado);
      // Implementar lógica de guardado
    }
  }

  exportarPDF(): void {
    //console.log('🔥 [NUEVO] Método exportarPDF ejecutándose...');

    if (!this.presupuesto) {
      console.error('❌ [NUEVO] No hay presupuesto disponible');
      alert('No hay datos de presupuesto disponibles');
      return;
    }

    // console.log('🔥 [NUEVO] Presupuesto encontrado:', {
    //   numero: this.presupuesto.numeroPresupuesto,
    //   empresa: this.presupuesto.nombreEmpresa,
    //   productos: this.presupuesto.productos?.length || 0
    // });

    try {
      //console.log('🔥 [NUEVO] Creando PDF simple...');

      // Crear PDF simple con jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      //console.log('🔥 [NUEVO] jsPDF creado exitosamente');

      // Añadir contenido de texto simple
      pdf.setFontSize(20);
      pdf.text('PRESUPUESTO', 20, 30);

      pdf.setFontSize(14);
      pdf.text(`Número: ${this.presupuesto.numeroPresupuesto}`, 20, 50);
      pdf.text(`Empresa: ${this.presupuesto.nombreEmpresa}`, 20, 65);
      pdf.text(`Email: ${this.presupuesto.email}`, 20, 80);
      pdf.text(`Teléfono: ${this.presupuesto.telefono}`, 20, 95);

      let yPos = 120;

      if (this.presupuesto.productos && this.presupuesto.productos.length > 0) {
        pdf.text('PRODUCTOS:', 20, yPos);
        yPos += 15;

        this.presupuesto.productos.forEach((producto, index) => {
          pdf.text(`${index + 1}. ${producto.nombre} - Cantidad: ${producto.cantidad}`, 25, yPos);
          yPos += 15;
        });
      }

      pdf.text(`TOTAL: ${this.formatCurrency(this.presupuesto.precioTotal || 0)}`, 20, yPos + 20);

      //console.log('🔥 [NUEVO] Contenido añadido al PDF');

      // Descargar
      const fileName = `Presupuesto_${this.presupuesto.numeroPresupuesto}_Test.pdf`;
      //console.log('🔥 [NUEVO] Descargando:', fileName);

      pdf.save(fileName);
      //console.log('✅ [NUEVO] PDF descargado exitosamente!');

      alert('PDF de prueba generado: ' + fileName);

    } catch (error: any) {
      console.error('❌ [NUEVO] Error:', error);
      alert('Error: ' + (error?.message || 'Error desconocido'));
    }
  }

  // MÉTODO PROFESIONAL PARA GENERAR PDF CON DISEÑO ELEGANTE
  descargarPDFNuevo(): void {
    //console.log('🎨 [PDF PROFESIONAL] Generando PDF con diseño elegante...');

    if (!this.presupuesto) {
      console.error('❌ [PDF PROFESIONAL] No hay presupuesto disponible');
      alert('No hay datos de presupuesto disponibles');
      return;
    }

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width
      const pageHeight = 297; // A4 height
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      //console.log('🎨 [PDF PROFESIONAL] Configurando diseño...');

      // COLORES CORPORATIVOS
      const primaryColor: [number, number, number] = [139, 69, 19]; // Marrón chocolate #8B4513
      const secondaryColor: [number, number, number] = [245, 245, 220]; // Beige claro #F5F5DC
      const textColor: [number, number, number] = [51, 51, 51]; // Gris oscuro #333333
      const accentColor: [number, number, number] = [255, 140, 0]; // Naranja #FF8C00

      let yPosition = margin;

      // ===== HEADER ELEGANTE =====
      // Fondo del header
      pdf.setFillColor(...primaryColor);
      pdf.rect(0, 0, pageWidth, 60, 'F');

      // Logo y título principal
      pdf.setTextColor(255, 255, 255); // Blanco
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LOGOLATE', margin, 30);

      // Número de presupuesto en el header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      const presupuestoText = `PRESUPUESTO #${this.presupuesto.numeroPresupuesto}`;
      const textWidth = pdf.getTextWidth(presupuestoText);
      pdf.text(presupuestoText, pageWidth - margin - textWidth, 30);

      // Fecha
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const fechaText = `Fecha: ${this.formatDate(this.presupuesto.fecha)}`;
      const fechaWidth = pdf.getTextWidth(fechaText);
      pdf.text(fechaText, pageWidth - margin - fechaWidth, 45);

      yPosition = 80;

      // ===== INFORMACIÓN DEL CLIENTE =====
      pdf.setTextColor(...textColor);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DATOS DEL CLIENTE', margin, yPosition);

      // Línea decorativa bajo el título
      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(1);
      pdf.line(margin, yPosition + 3, margin + 60, yPosition + 3);

      yPosition += 15;

      // Crear caja con fondo para los datos del cliente
      pdf.setFillColor(...secondaryColor);
      pdf.roundedRect(margin, yPosition - 5, contentWidth, 35, 3, 3, 'F');

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textColor);

      // Datos del cliente en dos columnas
      pdf.text(`Empresa: ${this.presupuesto.nombreEmpresa}`, margin + 5, yPosition + 5);
      pdf.text(`Email: ${this.presupuesto.email}`, margin + 5, yPosition + 15);
      pdf.text(`Teléfono: ${this.presupuesto.telefono}`, margin + 5, yPosition + 25);

      if (this.presupuesto.direccion) {
        pdf.text(`Dirección: ${this.presupuesto.direccion}`, margin + 90, yPosition + 5);
      }

      // Estado del presupuesto
      const estadoText = `Estado: ${this.presupuesto.estado.toUpperCase()}`;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...accentColor);
      pdf.text(estadoText, margin + 90, yPosition + 15);

      yPosition += 50;

      // ===== TABLA DE PRODUCTOS =====
      pdf.setTextColor(...textColor);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PRODUCTOS SOLICITADOS', margin, yPosition);

      // Línea decorativa
      pdf.setDrawColor(...primaryColor);
      pdf.line(margin, yPosition + 3, margin + 80, yPosition + 3);

      yPosition += 15;

      if (this.presupuesto.productos && this.presupuesto.productos.length > 0) {
        // Header de la tabla
        pdf.setFillColor(...primaryColor);
        pdf.rect(margin, yPosition, contentWidth, 12, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');

        pdf.text('PRODUCTO', margin + 3, yPosition + 8);
        pdf.text('CATEGORÍA', margin + 70, yPosition + 8);
        pdf.text('CANT.', margin + 110, yPosition + 8);
        pdf.text('PRECIO UNIT.', margin + 130, yPosition + 8);
        pdf.text('TOTAL', margin + 160, yPosition + 8);

        yPosition += 12;

        // Filas de productos
        pdf.setTextColor(...textColor);
        pdf.setFont('helvetica', 'normal');

        this.presupuesto.productos.forEach((producto, index) => {
          // Alternar colores de fila
          if (index % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, yPosition, contentWidth, 10, 'F');
          }

          pdf.setFontSize(9);

          // Truncar texto si es muy largo
          const nombreTruncado = producto.nombre.length > 25 ?
            producto.nombre.substring(0, 25) + '...' : producto.nombre;
          const categoriaTruncada = producto.categoria.length > 15 ?
            producto.categoria.substring(0, 15) + '...' : producto.categoria;

          pdf.text(nombreTruncado, margin + 3, yPosition + 7);
          pdf.text(categoriaTruncada, margin + 70, yPosition + 7);
          pdf.text(producto.cantidad.toString(), margin + 115, yPosition + 7);
          pdf.text(this.formatCurrency(producto.precioUnitario), margin + 130, yPosition + 7);
          pdf.text(this.formatCurrency(producto.precioTotal), margin + 160, yPosition + 7);

          yPosition += 10;

          // Verificar si necesitamos nueva página
          if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = margin;
          }
        });

        yPosition += 10;
      }

      // ===== RESUMEN FINANCIERO =====
      // Caja para el resumen (más alta para acomodar el total)
      pdf.setFillColor(...secondaryColor);
      pdf.roundedRect(margin + contentWidth - 90, yPosition, 90, 50, 3, 3, 'F');

      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(1);
      pdf.roundedRect(margin + contentWidth - 90, yPosition, 90, 50, 3, 3, 'S');

      pdf.setTextColor(...textColor);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RESUMEN', margin + contentWidth - 85, yPosition + 10);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Productos: ${this.presupuesto.productos?.length || 0}`, margin + contentWidth - 85, yPosition + 20);
      pdf.text(`Cantidad total: ${this.presupuesto.cantidadTotal || 0}`, margin + contentWidth - 85, yPosition + 28);

      // Línea separadora antes del total
      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(0.5);
      pdf.line(margin + contentWidth - 85, yPosition + 32, margin + contentWidth - 10, yPosition + 32);

      // Total destacado dentro de la caja
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...accentColor);
      pdf.text('TOTAL:', margin + contentWidth - 85, yPosition + 40);

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      const totalText = this.formatCurrency(this.presupuesto.precioTotal || 0);
      pdf.text(totalText, margin + contentWidth - 85, yPosition + 47);

      yPosition += 50;

      // ===== NOTAS Y APUNTES =====
      if (this.presupuesto.apuntes && this.presupuesto.apuntes.trim()) {
        pdf.setTextColor(...textColor);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('NOTAS ADICIONALES', margin, yPosition);

        pdf.setDrawColor(...primaryColor);
        pdf.line(margin, yPosition + 3, margin + 60, yPosition + 3);

        yPosition += 10;

        pdf.setFillColor(...secondaryColor);
        pdf.roundedRect(margin, yPosition, contentWidth, 20, 3, 3, 'F');

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

        // Dividir texto en líneas
        const lines = pdf.splitTextToSize(this.presupuesto.apuntes, contentWidth - 10);
        pdf.text(lines, margin + 5, yPosition + 8);

        yPosition += 25;
      }

      // ===== FOOTER ELEGANTE =====
      const footerY = pageHeight - 30;

      // Línea decorativa
      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(0.5);
      pdf.line(margin, footerY, pageWidth - margin, footerY);

      pdf.setTextColor(...primaryColor);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');

      const footerText = 'Logolate - Dulces Artesanales | www.logolate.com | info@logolate.com';
      const footerWidth = pdf.getTextWidth(footerText);
      pdf.text(footerText, (pageWidth - footerWidth) / 2, footerY + 8);

      // Generar nombre de archivo
      const fileName = `Presupuesto_${this.presupuesto.numeroPresupuesto}_${this.presupuesto.nombreEmpresa.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

      //console.log('🎨 [PDF PROFESIONAL] PDF generado exitosamente');

      // Descargar el PDF
      pdf.save(fileName);

      // Mostrar mensaje de éxito
      alert(`✅ PDF profesional generado exitosamente:\n${fileName}`);

    } catch (error: any) {
      console.error('❌ [PDF PROFESIONAL] Error:', error);
      alert('Error al generar el PDF profesional: ' + (error?.message || 'Error desconocido'));
    }
  }

  private createPDFContent(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      width: 800px;
      padding: 40px;
      background: white;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #333;
      position: absolute;
      top: -9999px;
      left: -9999px;
    `;

    container.innerHTML = `
      <!-- Header del presupuesto -->
      <div style="border-bottom: 3px solid #8B4513; padding-bottom: 20px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #8B4513;">Presupuesto #${this.presupuesto?.numeroPresupuesto}</h1>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Fecha: ${this.formatDate(this.presupuesto?.fecha || new Date())}</p>
          </div>
          <div style="text-align: right;">
            <div style="${this.getPDFEstadoStyle(this.presupuesto?.estado || '')}">
              ${this.getEstadoLabel(this.presupuesto?.estado || '')}
            </div>
          </div>
        </div>
      </div>

      <!-- Información de la empresa -->
      <div style="margin-bottom: 30px;">
        <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 600; color: #8B4513;">📋 Información de la Empresa</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #8B4513;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong style="color: #8B4513;">Empresa:</strong><br>
              <span>${this.presupuesto?.nombreEmpresa || 'Sin empresa'}</span>
            </div>
            <div>
              <strong style="color: #8B4513;">Contacto:</strong><br>
              <span>${this.presupuesto?.nombreContacto || 'Sin contacto'}</span>
            </div>
            <div>
              <strong style="color: #8B4513;">Email:</strong><br>
              <span>${this.presupuesto?.email || 'Sin email'}</span>
            </div>
            <div>
              <strong style="color: #8B4513;">Teléfono:</strong><br>
              <span>${this.presupuesto?.telefono || 'Sin teléfono'}</span>
            </div>
          </div>
          ${this.presupuesto?.direccion ? `
            <div style="margin-top: 15px; grid-column: 1 / -1;">
              <strong style="color: #8B4513;">Dirección:</strong><br>
              <span>${this.presupuesto.direccion}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Productos -->
      <div style="margin-bottom: 30px;">
        <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 600; color: #8B4513;">🛍️ Productos</h2>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: linear-gradient(135deg, #8B4513, #A0522D); color: white;">
              <th style="padding: 12px; text-align: left; font-weight: 600;">Producto</th>
              <th style="padding: 12px; text-align: center; font-weight: 600;">Cantidad</th>
              <th style="padding: 12px; text-align: right; font-weight: 600;">Precio Unit.</th>
              <th style="padding: 12px; text-align: right; font-weight: 600;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${this.presupuesto?.productos.map((producto, index) => `
              <tr style="border-bottom: 1px solid #e9ecef; ${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                <td style="padding: 12px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; background: #e9ecef; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 20px;">🍫</div>
                    <div>
                      <div style="font-weight: 600; color: #333;">${producto.nombre}</div>
                      <div style="font-size: 12px; color: #666;">${producto.categoria}</div>
                    </div>
                  </div>
                </td>
                <td style="padding: 12px; text-align: center; font-weight: 600;">${producto.cantidad}</td>
                <td style="padding: 12px; text-align: right;">${this.formatCurrency(producto.precioUnitario)}</td>
                <td style="padding: 12px; text-align: right; font-weight: 600;">${this.formatCurrency(producto.precioUnitario * producto.cantidad)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Resumen -->
      <div style="margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 8px; border: 2px solid #8B4513;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin: 0; font-size: 18px; color: #8B4513;">📊 Resumen del Presupuesto</h3>
              <p style="margin: 5px 0 0 0; color: #666;">Cantidad total de productos: <strong>${this.presupuesto?.cantidadTotal || 0}</strong></p>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 24px; font-weight: 700; color: #8B4513;">
                TOTAL: ${this.formatCurrency(this.presupuesto?.precioTotal || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      ${this.presupuesto?.apuntes ? `
        <!-- Apuntes -->
        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 600; color: #8B4513;">📝 Apuntes</h2>
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">${this.presupuesto.apuntes}</p>
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #8B4513; text-align: center; color: #666;">
        <p style="margin: 0; font-size: 14px;">Presupuesto generado por <strong style="color: #8B4513;">Logolate</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 12px;">Fecha de generación: ${this.formatDate(new Date())}</p>
      </div>
    `;

    return container;
  }

  private getPDFEstadoStyle(estado: string): string {
    const normalizedEstado = estado.toLowerCase();
    const baseStyle = 'padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; display: inline-block;';

    switch (normalizedEstado) {
      case 'aprobado':
      case 'aceptado':
        return `${baseStyle} background: linear-gradient(135deg, #55efc4, #00b894); color: white;`;
      case 'rechazado':
        return `${baseStyle} background: linear-gradient(135deg, #fd79a8, #e84393); color: white;`;
      case 'pendiente':
        return `${baseStyle} background: linear-gradient(135deg, #ffeaa7, #fdcb6e); color: #d63031;`;
      case 'en_proceso':
        return `${baseStyle} background: linear-gradient(135deg, #a29bfe, #6c5ce7); color: white;`;
      case 'enviado':
        return `${baseStyle} background: linear-gradient(135deg, #74b9ff, #0984e3); color: white;`;
      case 'completado':
        return `${baseStyle} background: linear-gradient(135deg, #00b894, #00a085); color: white;`;
      case 'cancelado':
        return `${baseStyle} background: linear-gradient(135deg, #636e72, #2d3436); color: white;`;
      case 'vencido':
        return `${baseStyle} background: linear-gradient(135deg, #e17055, #d63031); color: white;`;
      default:
        return `${baseStyle} background: linear-gradient(135deg, #ddd, #bbb); color: #333;`;
    }
  }

  private getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'en_proceso': 'En Proceso',
      'enviado': 'Enviado',
      'aprobado': 'Aprobado',
      'aceptado': 'Aprobado',
      'rechazado': 'Rechazado',
      'vencido': 'Vencido',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return labels[estado.toLowerCase()] || estado;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) {
      return 'Fecha no disponible';
    }

    let dateObj: Date;

    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }

    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(dateObj);
  }

  volverALista(): void {
    this.router.navigate(['/logoadmin/presupuestos']);
  }

  // Métodos para gestión de apuntes
  editarApuntes(): void {
    this.editingNotes = true;
    this.tempNotes = this.presupuesto?.apuntes || '';
  }

  guardarApuntes(): void {
    if (this.presupuesto) {
      this.presupuesto.apuntes = this.tempNotes;
      this.editingNotes = false;
      //console.log('Apuntes guardados:', this.tempNotes);
      // Implementar lógica de guardado en el backend
    }
  }

  cancelarEdicionApuntes(): void {
    this.editingNotes = false;
    this.tempNotes = '';
  }

  // Sidebar methods
  private loadUserData(): void {
    const userData = localStorage.getItem('backoffice_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    } else {
      this.currentUser = {
        username: 'Admin',
        role: 'Administrador'
      };
    }
  }

  // Métodos de navegación ya no necesarios - el layout reutilizable maneja la navegación

  logout(): void {
    this.authService.logout();
  }

  /**
   * Verificar si es dispositivo móvil
   */
  isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  /**
   * Manejar carga exitosa de imágenes (para debugging)
   */
  onImageLoad(event: Event, productName: string): void {
    //console.log('✅ Imagen cargada exitosamente:', productName, event);
  }

  /**
   * Manejar errores de carga de imágenes
   */
  onImageError(event: Event, fallbackType: 'logo' | 'product'): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.dataset['fallbackApplied']) {
      // Marcar que ya se aplicó el fallback para evitar bucles
      target.dataset['fallbackApplied'] = 'true';

      // Usar SVG inline como fallback
      if (fallbackType === 'logo') {
        target.src = 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">
            <rect width="120" height="80" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
            <text x="60" y="35" text-anchor="middle" font-family="Arial" font-size="12" fill="#6c757d">Sin Logo</text>
            <text x="60" y="50" text-anchor="middle" font-family="Arial" font-size="10" fill="#adb5bd">Empresa</text>
          </svg>
        `);
      } else {
        target.src = 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
            <rect width="60" height="60" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
            <text x="30" y="30" text-anchor="middle" font-family="Arial" font-size="10" fill="#6c757d">Sin</text>
            <text x="30" y="42" text-anchor="middle" font-family="Arial" font-size="10" fill="#6c757d">Imagen</text>
          </svg>
        `);
      }
    }
  }

  /**
   * Convertir URL relativa del backend a URL absoluta
   */
  getAbsoluteImageUrl(relativeUrl: string): string {
    if (!relativeUrl) {
      return this.getPlaceholderImage();
    }

    // Si ya es una URL absoluta, devolverla tal como está
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://') || relativeUrl.startsWith('data:')) {
      return relativeUrl;
    }

    // Convertir URL relativa a absoluta del backend
    const backendUrl = 'http://localhost:3000';
    const cleanUrl = relativeUrl.startsWith('/') ? relativeUrl : '/' + relativeUrl;
    const absoluteUrl = backendUrl + cleanUrl;

    //console.log('🖼️ DEBUG: Convirtiendo URL:', { relativeUrl, absoluteUrl });
    return absoluteUrl;
  }

  /**
   * Obtener imagen placeholder por defecto
   */
  getPlaceholderImage(): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
        <rect width="60" height="60" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
        <text x="30" y="30" text-anchor="middle" font-family="Arial" font-size="10" fill="#6c757d">Sin</text>
        <text x="30" y="42" text-anchor="middle" font-family="Arial" font-size="10" fill="#6c757d">Imagen</text>
      </svg>
    `);
  }

  /**
   * Convertir datos ENRIQUECIDOS del backend (Budget con productos reales) al formato del frontend
   */
  private convertEnrichedBudgetToPresupuesto(budget: any): Presupuesto {
  //console.log('🔄 DEBUG: Convirtiendo budget ENRIQUECIDO del backend:', budget);
  //console.log('🎨 DEBUG: Logotipo en budget - logoEmpresa:', budget.logoEmpresa);
  //console.log('🎨 DEBUG: Logotipo en budget - logotipoEmpresa:', budget.logotipoEmpresa);

    // Convertir productos enriquecidos del backend al formato del frontend
    const productos: ProductoPresupuesto[] = (budget.productos || []).map((prod: any, index: number) => {
      //console.log(`📦 DEBUG: Producto ${index + 1} enriquecido:`, prod);

      return {
        id: prod.productoId || prod.productId || (index + 1).toString(), // ✅ CORREGIDO: Preservar productId real
        // Usar datos del producto real si están disponibles
        nombre: prod.producto?.nombre || prod.nombre || 'Producto sin nombre',
        categoria: prod.producto?.categoria?.nombre || prod.categoria || 'Sin categoría',
        cantidad: prod.cantidad || 0,
        precioUnitario: prod.precioUnitario || 0,  // Precio específico del presupuesto
        precioTotal: (prod.cantidad || 0) * (prod.precioUnitario || 0),
        // Usar imagen real del producto desde el backend (con URL absoluta)
        imagen: this.getAbsoluteImageUrl(prod.imagen || prod.producto?.imagen),
        // Información adicional del producto real
        referencia: prod.producto?.referencia || '',
        precioOriginal: prod.producto?.precio || prod.precioUnitario,  // Precio actual del catálogo
        categoriaColor: prod.producto?.categoria?.color || '#6c757d'
      };
    });

    // Calcular totales
    const cantidadTotal = productos.reduce((sum, prod) => sum + prod.cantidad, 0);
    const precioTotal = productos.reduce((sum, prod) => sum + prod.precioTotal, 0);

    const presupuesto: Presupuesto = {
      id: budget._id || budget.id,
      numeroPresupuesto: budget.numeroPresupuesto || 0,
      numeroPedido: budget.numeroPedido || `P-${budget.numeroPresupuesto || 0}`,
      nombreEmpresa: budget.cliente?.empresa || 'Empresa no especificada',
      nombreContacto: budget.cliente?.nombre || 'Contacto no especificado',
      email: budget.cliente?.email || 'email@ejemplo.com',
      telefono: budget.cliente?.telefono || 'No especificado',
      direccion: budget.cliente?.direccion || '',
      fecha: budget.createdAt ? new Date(budget.createdAt) : new Date(),
      estado: budget.estado || 'pendiente',
      productos: productos,
      logoEmpresa: this.getLogoUrl(budget.logotipoEmpresa || budget.logoEmpresa),
      aceptaCorreosPublicitarios: budget.aceptaCorreosPublicitarios || false,
      cantidadTotal: cantidadTotal,
      precioTotal: precioTotal,
      apuntes: budget.cliente?.detalles || budget.detallesCliente || '',
      observaciones: budget.observaciones || ''
    };

    //console.log('✅ DEBUG: Presupuesto ENRIQUECIDO convertido:', presupuesto);
    return presupuesto;
  }

  /**
   * Convertir datos del backend (Budget) al formato del frontend (Presupuesto) - MÉTODO TRADICIONAL
   */
  private convertBudgetToPresupuesto(budget: any): Presupuesto {
    //console.log('🔄 DEBUG: Convirtiendo budget del backend:', budget);

    // Convertir productos del backend al formato del frontend
    const productos: ProductoPresupuesto[] = (budget.productos || []).map((prod: any, index: number) => ({
      id: (index + 1).toString(),
      nombre: prod.nombre || 'Producto sin nombre',
      categoria: prod.categoria || 'Sin categoría',
      cantidad: prod.cantidad || 0,
      precioUnitario: prod.precioUnitario || prod.precio || 0,
      precioTotal: (prod.cantidad || 0) * (prod.precioUnitario || prod.precio || 0),
      // Usar imagen real del producto desde el backend (fallback)
      imagen: this.getAbsoluteImageUrl(prod.imagen || prod.producto?.imagen),
    }));

    // Calcular totales
    const cantidadTotal = productos.reduce((sum, prod) => sum + prod.cantidad, 0);
    const precioTotal = productos.reduce((sum, prod) => sum + prod.precioTotal, 0);

    const presupuesto: Presupuesto = {
      id: budget._id || budget.id,
      numeroPresupuesto: budget.numeroPresupuesto || 0,
      numeroPedido: budget.numeroPedido || `P-${budget.numeroPresupuesto || 0}`,
      nombreEmpresa: budget.cliente?.empresa || 'Empresa no especificada',
      nombreContacto: budget.cliente?.nombre || 'Contacto no especificado',
      email: budget.cliente?.email || 'email@ejemplo.com',
      telefono: budget.cliente?.telefono || 'No especificado',
      direccion: budget.cliente?.direccion || '',
      fecha: budget.createdAt ? new Date(budget.createdAt) : new Date(),
      estado: budget.estado || 'pendiente',
      productos: productos,
      logoEmpresa: this.getLogoUrl(budget.logotipoEmpresa || budget.logoEmpresa),
      aceptaCorreosPublicitarios: budget.aceptaCorreosPublicitarios || false,
      cantidadTotal: cantidadTotal,
      precioTotal: precioTotal,
      apuntes: budget.cliente?.detalles || budget.detallesCliente || '',
      observaciones: budget.observaciones || ''
    };

    //console.log('✅ DEBUG: Presupuesto convertido:', presupuesto);
    return presupuesto;
  }

  /**
   * Procesar URL del logotipo de empresa
   */
  private getLogoUrl(logoPath: string | undefined): string {
    //console.log('🎨 [PRESUPUESTO-DETALLE] Procesando URL del logotipo:', logoPath);

    if (!logoPath) {
      //console.log('🎨 [PRESUPUESTO-DETALLE] No hay logotipo, usando placeholder');
      return '/assets/images/logo-placeholder.jpg';
    }

    // Si ya es una URL completa, usarla tal como está
    if (logoPath.startsWith('http')) {
      //console.log('🎨 [PRESUPUESTO-DETALLE] URL completa del logotipo:', logoPath);
      return logoPath;
    }

    // Si empieza con /uploads, construir URL completa del backend
    if (logoPath.startsWith('/uploads')) {
      const fullUrl = `http://localhost:3000${logoPath}`;
      //console.log('🎨 [PRESUPUESTO-DETALLE] URL construida del backend:', fullUrl);
      return fullUrl;
    }

    // Si es una referencia base64, manejarla apropiadamente
    if (logoPath.startsWith('base64-logo-')) {
      //console.log('🎨 [PRESUPUESTO-DETALLE] Logotipo base64 detectado, usando placeholder temporalmente');
      return '/assets/images/logo-placeholder.jpg';
    }

    // Fallback: asumir que es una ruta relativa y construir URL completa
    const fallbackUrl = `http://localhost:3000/uploads/logos/${logoPath}`;
    //console.log('🎨 [PRESUPUESTO-DETALLE] URL fallback construida:', fallbackUrl);
    return fallbackUrl;
  }
}
