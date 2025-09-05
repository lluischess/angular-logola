import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface PresupuestoEmailData {
  presupuesto: {
    id: string;
    numeroPresupuesto: string;
    fechaCreacion: string;
    estado: string;
    total: number;
    cliente: {
      nombre: string;
      email: string;
      telefono?: string;
      empresa?: string;
    };
    productos: Array<{
      nombre: string;
      cantidad: number;
      precio: number;
      subtotal: number;
    }>;
  };
  emailAdministracion: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Enviar email genérico
   */
  sendEmail(emailData: EmailData): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/email/send`, emailData, { headers });
  }

  /**
   * Enviar notificación de nuevo presupuesto al administrador
   */
  sendNewPresupuestoNotificationToAdmin(data: PresupuestoEmailData): Observable<any> {
    const emailData: EmailData = {
      to: data.emailAdministracion,
      subject: `🆕 Nuevo Presupuesto #${data.presupuesto.numeroPresupuesto} - Logolate`,
      html: this.generateAdminNotificationTemplate(data.presupuesto)
    };

    return this.sendEmail(emailData);
  }

  /**
   * Enviar confirmación de presupuesto al cliente
   */
  sendPresupuestoConfirmationToClient(data: PresupuestoEmailData): Observable<any> {
    const emailData: EmailData = {
      to: data.presupuesto.cliente.email,
      subject: `✅ Presupuesto Recibido #${data.presupuesto.numeroPresupuesto} - Logolate`,
      html: this.generateClientConfirmationTemplate(data.presupuesto)
    };

    return this.sendEmail(emailData);
  }

  /**
   * Enviar ambos emails de nuevo presupuesto (admin + cliente)
   */
  sendNewPresupuestoEmails(data: PresupuestoEmailData): Observable<any> {
    //console.log('📧 [EMAIL-SERVICE] === ENVIANDO EMAILS DE NUEVO PRESUPUESTO ===');
    //console.log('📧 [EMAIL-SERVICE] Datos recibidos:', data);

    // Usar el nuevo endpoint del backend
    const emailData = {
      presupuesto: data.presupuesto,
      emailAdministracion: data.emailAdministracion
    };

    return this.http.post<any>(`${this.apiUrl}/send-presupuesto-notifications`, emailData).pipe(
      tap(response => {
        //console.log('✅ [EMAIL-SERVICE] Respuesta del backend:', response);
      }),
      catchError(error => {
        console.error('❌ [EMAIL-SERVICE] Error del backend:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Template de email para notificación al administrador
   */
  private generateAdminNotificationTemplate(presupuesto: any): string {
    const productosHtml = presupuesto.productos.map((producto: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${producto.nombre}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${producto.cantidad}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${producto.precio.toFixed(2)}€</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${producto.subtotal.toFixed(2)}€</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nuevo Presupuesto - Logolate</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #8B4513; }
          .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .table th { background: #8B4513; color: white; padding: 10px; text-align: left; }
          .table td { padding: 8px; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; color: #8B4513; text-align: right; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🆕 Nuevo Presupuesto Recibido</h1>
            <p>Presupuesto #${presupuesto.numeroPresupuesto}</p>
          </div>

          <div class="content">
            <div class="info-box">
              <h3>📋 Información del Presupuesto</h3>
              <p><strong>Número:</strong> #${presupuesto.numeroPresupuesto}</p>
              <p><strong>Fecha:</strong> ${new Date(presupuesto.fechaCreacion).toLocaleDateString('es-ES')}</p>
              <p><strong>Estado:</strong> ${presupuesto.estado}</p>
            </div>

            <div class="info-box">
              <h3>👤 Información del Cliente</h3>
              <p><strong>Nombre:</strong> ${presupuesto.cliente.nombre}</p>
              <p><strong>Email:</strong> ${presupuesto.cliente.email}</p>
              ${presupuesto.cliente.telefono ? `<p><strong>Teléfono:</strong> ${presupuesto.cliente.telefono}</p>` : ''}
              ${presupuesto.cliente.empresa ? `<p><strong>Empresa:</strong> ${presupuesto.cliente.empresa}</p>` : ''}
            </div>

            <div class="info-box">
              <h3>🛍️ Productos Solicitados</h3>
              <table class="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align: center;">Cantidad</th>
                    <th style="text-align: right;">Precio Unit.</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${productosHtml}
                </tbody>
              </table>
              <div class="total">
                Total: ${presupuesto.total.toFixed(2)}€
              </div>
            </div>

            <div class="info-box">
              <h3>📞 Próximos Pasos</h3>
              <p>• Revisar los productos solicitados</p>
              <p>• Contactar al cliente para confirmar detalles</p>
              <p>• Procesar el presupuesto en el sistema</p>
            </div>
          </div>

          <div class="footer">
            <p>Este email fue generado automáticamente por el sistema Logolate</p>
            <p>Para gestionar este presupuesto, accede al panel de administración</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template de email para confirmación al cliente
   */
  private generateClientConfirmationTemplate(presupuesto: any): string {
    const productosHtml = presupuesto.productos.map((producto: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${producto.nombre}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${producto.cantidad}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${producto.precio.toFixed(2)}€</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${producto.subtotal.toFixed(2)}€</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmación de Presupuesto - Logolate</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #8B4513; }
          .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .table th { background: #8B4513; color: white; padding: 10px; text-align: left; }
          .table td { padding: 8px; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; color: #8B4513; text-align: right; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Presupuesto Recibido</h1>
            <p>¡Gracias por confiar en Logolate!</p>
          </div>

          <div class="content">
            <div class="highlight">
              <h3>🎉 ¡Hemos recibido tu presupuesto!</h3>
              <p>Estimado/a <strong>${presupuesto.cliente.nombre}</strong>,</p>
              <p>Hemos recibido correctamente tu solicitud de presupuesto. Nuestro equipo la revisará y se pondrá en contacto contigo en breve para confirmar todos los detalles.</p>
            </div>

            <div class="info-box">
              <h3>📋 Resumen de tu Presupuesto</h3>
              <p><strong>Número de presupuesto:</strong> #${presupuesto.numeroPresupuesto}</p>
              <p><strong>Fecha de solicitud:</strong> ${new Date(presupuesto.fechaCreacion).toLocaleDateString('es-ES')}</p>
              <p><strong>Estado:</strong> ${presupuesto.estado}</p>
            </div>

            <div class="info-box">
              <h3>🛍️ Productos Solicitados</h3>
              <table class="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align: center;">Cantidad</th>
                    <th style="text-align: right;">Precio Unit.</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${productosHtml}
                </tbody>
              </table>
              <div class="total">
                Total estimado: ${presupuesto.total.toFixed(2)}€
              </div>
              <p style="font-size: 12px; color: #666; margin-top: 10px;">
                *Los precios son estimados y pueden variar según disponibilidad y especificaciones finales.
              </p>
            </div>

            <div class="info-box">
              <h3>📞 Próximos Pasos</h3>
              <p>• Revisaremos tu solicitud en un plazo máximo de 24 horas</p>
              <p>• Te contactaremos para confirmar detalles y disponibilidad</p>
              <p>• Una vez confirmado, procederemos con la preparación de tu pedido</p>
            </div>

            <div class="info-box">
              <h3>📧 ¿Tienes alguna pregunta?</h3>
              <p>Si tienes alguna duda o necesitas modificar algo en tu presupuesto, no dudes en contactarnos:</p>
              <p>📧 Email: info@logolate.com</p>
              <p>📞 Teléfono: +34 123 456 789</p>
            </div>
          </div>

          <div class="footer">
            <p><strong>Logolate - Dulces Artesanales Premium</strong></p>
            <p>Gracias por elegirnos para endulzar tus momentos especiales</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
