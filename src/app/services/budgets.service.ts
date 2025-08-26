import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { EmailService } from './email.service';
import { ConfigurationService } from '../shared/back/backoffice/services/configuration.service';

// Interfaces para el servicio de presupuestos
export interface BudgetProduct {
  productId: string;
  nombre: string;
  referencia: string;
  cantidad: number;
  precioUnitario?: number;
  subtotal?: number;
}

export interface ClientData {
  email: string;
  nombre: string;
  telefono?: string;
  direccion?: string;
  empresa?: string;
  detalles?: string;
}

export interface CreateBudgetRequest {
  cliente: ClientData;
  productos: BudgetProduct[];
  logotipoEmpresa?: string;
  aceptaCorreosPublicitarios?: boolean;
  notas?: string;
  precioTotal?: number;
  fechaVencimiento?: string;
}

export interface BudgetResponse {
  _id: string;
  numeroPresupuesto: number;
  cliente: ClientData;
  productos: BudgetProduct[];
  estado: string;
  fechaCreacion: string;
  fechaVencimiento?: string;
  precioTotal?: number;
  logotipoEmpresa?: string;
  notas?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetsService {
  private apiUrl = 'http://localhost:3000/budgets';
  private baseUrl = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private emailService: EmailService,
    private configurationService: ConfigurationService
  ) { }

  /**
   * Crear un nuevo presupuesto desde el carrito
   */
  createBudget(budgetData: CreateBudgetRequest): Observable<BudgetResponse> {
    console.log('💰 [BUDGETS-SERVICE] === CREANDO PRESUPUESTO ===');
    console.log('💰 [BUDGETS-SERVICE] Datos del presupuesto:', budgetData);
    console.log('💰 [BUDGETS-SERVICE] URL completa:', this.apiUrl);
    
    return new Observable(observer => {
      // Crear el presupuesto primero
      this.http.post<BudgetResponse>(this.apiUrl, budgetData).subscribe({
        next: (response) => {
          console.log('✅ [BUDGETS-SERVICE] Presupuesto creado exitosamente:', response);
          
          // Si el presupuesto se creó correctamente y está en estado pendiente, enviar emails
          if (response && response.estado === 'pendiente') {
            this.sendEmailNotifications(response).subscribe({
              next: (emailResults) => {
                console.log('📧 [BUDGETS-SERVICE] Emails enviados:', emailResults);
                // Devolver la respuesta del presupuesto independientemente del resultado de los emails
                observer.next(response);
                observer.complete();
              },
              error: (emailError) => {
                console.warn('⚠️ [BUDGETS-SERVICE] Error enviando emails, pero presupuesto creado:', emailError);
                // Devolver la respuesta del presupuesto aunque fallen los emails
                observer.next(response);
                observer.complete();
              }
            });
          } else {
            // Si no está en estado pendiente, no enviar emails
            observer.next(response);
            observer.complete();
          }
        },
        error: (error) => {
          console.error('❌ [BUDGETS-SERVICE] Error creando presupuesto:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Subir logotipo de empresa (método original con archivos)
   */
  uploadLogo(file: File): Observable<{ imagePath: string }> {
    console.log('📤 [BUDGETS-SERVICE] === SUBIENDO LOGOTIPO ===');
    console.log('📤 [BUDGETS-SERVICE] Archivo:', file.name, file.size, 'bytes');
    
    const formData = new FormData();
    formData.append('logo', file);
    
    return this.http.post<{ imagePath: string }>(`${this.baseUrl}/budgets/upload-logo`, formData);
  }

  /**
   * Subir logotipo como base64 (alternativa robusta)
   */
  uploadLogoBase64(file: File): Observable<{ imagePath: string; logoData: string }> {
    return new Observable(observer => {
      console.log('📤 [BUDGETS-SERVICE] === SUBIENDO LOGOTIPO BASE64 ===');
      console.log('📤 [BUDGETS-SERVICE] Archivo:', file.name, file.size, 'bytes');
      
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64Data = reader.result as string;
        console.log('📤 [BUDGETS-SERVICE] Archivo convertido a base64, tamaño:', base64Data.length);
        
        const payload = {
          logoData: base64Data,
          fileName: file.name
        };
        
        this.http.post<{ imagePath: string; logoData: string }>(`${this.baseUrl}/budgets/upload-logo-base64`, payload)
          .subscribe({
            next: (response) => {
              console.log('✅ [BUDGETS-SERVICE] Logotipo base64 subido exitosamente');
              observer.next(response);
              observer.complete();
            },
            error: (error) => {
              console.error('❌ [BUDGETS-SERVICE] Error subiendo logotipo base64:', error);
              observer.error(error);
            }
          });
      };
      
      reader.onerror = () => {
        console.error('❌ [BUDGETS-SERVICE] Error leyendo archivo');
        observer.error(new Error('Error leyendo archivo'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Obtener presupuesto por número (público)
   */
  getBudgetByNumber(numeroPresupuesto: number): Observable<BudgetResponse> {
    console.log('🔍 [BUDGETS-SERVICE] === CONSULTANDO PRESUPUESTO ===');
    console.log('🔍 [BUDGETS-SERVICE] Número:', numeroPresupuesto);
    
    return this.http.get<BudgetResponse>(`${this.apiUrl}/numero/${numeroPresupuesto}/enriched`);
  }

  /**
   * Validar productos del carrito antes de crear presupuesto
   */
  validateCartProducts(cartItems: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    console.log('✅ [BUDGETS-SERVICE] === VALIDANDO PRODUCTOS DEL CARRITO ===');
    console.log('✅ [BUDGETS-SERVICE] Productos a validar:', cartItems.length);
    
    if (!cartItems || cartItems.length === 0) {
      errors.push('No hay productos en el carrito para solicitar presupuesto');
      return { isValid: false, errors };
    }
    
    cartItems.forEach((item, index) => {
      console.log(`✅ [BUDGETS-SERVICE] Validando producto ${index + 1}:`, {
        nombre: item.nombre || item.name,
        cantidad: item.quantity,
        cantidadMinima: item.cantidadMinima
      });
      
      // Validar que el producto tenga los campos requeridos
      if (!item._id && !item.id) {
        errors.push(`Producto ${index + 1}: Falta el ID del producto`);
      }
      
      if (!item.nombre && !item.name) {
        errors.push(`Producto ${index + 1}: Falta el nombre del producto`);
      }
      
      if (!item.referencia) {
        errors.push(`Producto ${index + 1}: Falta la referencia del producto`);
      }
      
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Producto ${index + 1}: La cantidad debe ser mayor a 0`);
      }
      
      // Validar cantidad mínima de compra
      if (item.cantidadMinima && item.quantity < item.cantidadMinima) {
        const productName = item.nombre || item.name || `Producto ${index + 1}`;
        errors.push(`${productName}: La cantidad mínima de compra es ${item.cantidadMinima} unidades. Cantidad actual: ${item.quantity}`);
      }
    });
    
    console.log('✅ [BUDGETS-SERVICE] Resultado de validación:', {
      isValid: errors.length === 0,
      errorsCount: errors.length,
      errors
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convertir productos del carrito al formato requerido por el backend
   * Ahora incluye enriquecimiento con precios desde el backend
   */
  async enrichCartItemsWithPrices(cartItems: any[]): Promise<BudgetProduct[]> {
    console.log('🔄 [BUDGETS-SERVICE] === ENRIQUECIENDO PRODUCTOS CON PRECIOS ===');
    console.log('🔄 [BUDGETS-SERVICE] Productos originales:', cartItems);
    
    const enrichedProducts: BudgetProduct[] = [];
    
    for (const item of cartItems) {
      try {
        const productId = item._id || item.id;
        console.log('🔄 [BUDGETS-SERVICE] Obteniendo precios para producto:', productId);
        
        // Obtener información completa del producto desde el backend
        const fullProduct = await firstValueFrom(this.http.get<any>(`${this.baseUrl}/products/${productId}`));
        
        const enrichedProduct: BudgetProduct = {
          productId: productId,
          nombre: item.nombre || item.name || fullProduct.nombre,
          referencia: item.referencia || fullProduct.referencia,
          cantidad: item.quantity,
          precioUnitario: fullProduct.precio || 0, // Precio desde el backend
          subtotal: (fullProduct.precio || 0) * item.quantity
        };
        
        console.log('🔄 [BUDGETS-SERVICE] Producto enriquecido:', enrichedProduct);
        enrichedProducts.push(enrichedProduct);
        
      } catch (error) {
        console.warn('⚠️ [BUDGETS-SERVICE] Error obteniendo precio para producto:', item, error);
        
        // Fallback: usar producto sin precio
        const fallbackProduct: BudgetProduct = {
          productId: item._id || item.id,
          nombre: item.nombre || item.name,
          referencia: item.referencia,
          cantidad: item.quantity,
          precioUnitario: 0,
          subtotal: 0
        };
        
        enrichedProducts.push(fallbackProduct);
      }
    }
    
    console.log('🔄 [BUDGETS-SERVICE] Productos enriquecidos finales:', enrichedProducts);
    return enrichedProducts;
  }

  /**
   * Convertir productos del carrito al formato requerido por el backend (método legacy)
   */
  mapCartItemsToBudgetProducts(cartItems: any[]): BudgetProduct[] {
    console.log('🔄 [BUDGETS-SERVICE] === MAPEANDO PRODUCTOS DEL CARRITO (LEGACY) ===');
    console.log('🔄 [BUDGETS-SERVICE] Productos originales:', cartItems);
    
    const mappedProducts = cartItems.map(item => {
      const mappedProduct: BudgetProduct = {
        productId: item._id || item.id, // Mapear _id o id a productId
        nombre: item.nombre || item.name, // Mapear nombre o name
        referencia: item.referencia,
        cantidad: item.quantity,
        precioUnitario: item.precioUnitario || 0, // Opcional
        subtotal: (item.precioUnitario || 0) * item.quantity // Calcular subtotal si hay precio
      };
      
      console.log('🔄 [BUDGETS-SERVICE] Producto mapeado:', mappedProduct);
      return mappedProduct;
    });
    
    console.log('🔄 [BUDGETS-SERVICE] Productos mapeados finales:', mappedProducts);
    return mappedProducts;
  }

  /**
   * Enviar notificaciones por email cuando se crea un presupuesto
   */
  private sendEmailNotifications(presupuesto: BudgetResponse): Observable<any> {
    console.log('📧 [BUDGETS-SERVICE] === ENVIANDO NOTIFICACIONES POR EMAIL ===');
    console.log('📧 [BUDGETS-SERVICE] Presupuesto:', presupuesto);
    
    return new Observable(observer => {
      // Obtener el email de administración desde la configuración
      this.configurationService.getConfigurationSection('general').subscribe({
        next: (generalConfig) => {
          console.log('📧 [BUDGETS-SERVICE] Configuración general obtenida:', generalConfig);
          
          const emailAdministracion = generalConfig?.datos?.emailAdministracion || 'admin@logolate.com';
          console.log('📧 [BUDGETS-SERVICE] Email de administración:', emailAdministracion);
          
          // Preparar datos para el servicio de email
          const emailData = {
            presupuesto: {
              id: presupuesto._id,
              numeroPresupuesto: presupuesto.numeroPresupuesto.toString(),
              fechaCreacion: presupuesto.fechaCreacion,
              estado: presupuesto.estado,
              total: presupuesto.precioTotal || 0,
              cliente: {
                nombre: presupuesto.cliente.nombre,
                email: presupuesto.cliente.email,
                telefono: presupuesto.cliente.telefono,
                empresa: presupuesto.cliente.empresa
              },
              productos: presupuesto.productos.map(p => ({
                nombre: p.nombre,
                cantidad: p.cantidad,
                precio: p.precioUnitario || 0,
                subtotal: p.subtotal || 0
              }))
            },
            emailAdministracion: emailAdministracion
          };
          
          console.log('📧 [BUDGETS-SERVICE] Datos preparados para emails:', emailData);
          
          // Enviar ambos emails
          this.emailService.sendNewPresupuestoEmails(emailData).subscribe({
            next: (results: any) => {
              console.log('✅ [BUDGETS-SERVICE] Emails procesados:', results);
              observer.next(results);
              observer.complete();
            },
            error: (error: any) => {
              console.error('❌ [BUDGETS-SERVICE] Error enviando emails:', error);
              observer.error(error);
            }
          });
        },
        error: (configError: any) => {
          console.warn('⚠️ [BUDGETS-SERVICE] Error obteniendo configuración, usando email por defecto:', configError);
          
          // Usar email por defecto si no se puede obtener la configuración
          const emailData = {
            presupuesto: {
              id: presupuesto._id,
              numeroPresupuesto: presupuesto.numeroPresupuesto.toString(),
              fechaCreacion: presupuesto.fechaCreacion,
              estado: presupuesto.estado,
              total: presupuesto.precioTotal || 0,
              cliente: {
                nombre: presupuesto.cliente.nombre,
                email: presupuesto.cliente.email,
                telefono: presupuesto.cliente.telefono,
                empresa: presupuesto.cliente.empresa
              },
              productos: presupuesto.productos.map(p => ({
                nombre: p.nombre,
                cantidad: p.cantidad,
                precio: p.precioUnitario || 0,
                subtotal: p.subtotal || 0
              }))
            },
            emailAdministracion: 'admin@logolate.com'
          };
          
          // Enviar emails con configuración por defecto
          this.emailService.sendNewPresupuestoEmails(emailData).subscribe({
            next: (results: any) => {
              console.log('✅ [BUDGETS-SERVICE] Emails enviados con configuración por defecto:', results);
              observer.next(results);
              observer.complete();
            },
            error: (error: any) => {
              console.error('❌ [BUDGETS-SERVICE] Error enviando emails con configuración por defecto:', error);
              observer.error(error);
            }
          });
        }
      });
    });
  }
}
