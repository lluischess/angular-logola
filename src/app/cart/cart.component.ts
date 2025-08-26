import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { Subscription, firstValueFrom } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartServiceService } from '../shared/services/cart-service.service';
import { BudgetsService, CreateBudgetRequest } from '../services/budgets.service';
import { ProductsService } from '../services/products.service';

// Declarar grecaptcha para TypeScript
declare var grecaptcha: any;

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']  // Cambié styleUrl a styleUrls
})
export class CartComponent implements OnInit, AfterViewInit, OnDestroy {
  cartItems: any[] = [];
  termsForm: FormGroup;
  totalUnits: number = 0;  // Variable para total de unidades
  isRecaptchaValid: boolean = false;
  recaptchaResponse: string = '';
  isSubmitting: boolean = false;  // Estado para prevenir doble envío
  
  // Suscripciones para el sistema reactivo del carrito
  private cartItemsSubscription?: Subscription;
  private totalUnitsSubscription?: Subscription;

  getCartItems() {
    // Función que retorna los items del carrito (ejemplo)
    return [
      { name: 'BOMBÓN NAVIDAD EN BOLSA UNITARIA PERSONALIZADA', referencia: 'BE-015-156', image: 'assets/images/BE-015-156.jpg', quantity: 0 },
      { name: 'Botes de Logolate', referencia: 'EN-130-b-&-EN-170', image: 'assets/images/EN-130-b-y-EN-170.jpg', quantity: 0 },
      { name: 'BOTES PET CON DULCES NAVIDEÑOS', referencia: 'EN-130G-175', image: 'assets/images/EN-130G-175.jpg', quantity: 0 }
    ];
  }



  ngAfterViewInit() {
    // Inicializar reCAPTCHA después de que la vista se haya cargado
    // Usar setTimeout para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
      this.loadRecaptcha();
    }, 100);
  }

  loadRecaptcha() {
    // Esperar a que el script de reCAPTCHA se cargue y el elemento DOM exista
    const checkRecaptcha = () => {
      const container = document.getElementById('recaptcha-container');

      if (typeof grecaptcha !== 'undefined' && container) {
        try {
          grecaptcha.render('recaptcha-container', {
            'sitekey': '6LcwpokrAAAAAKFnlFweJDaRBfapAWJJlbkq_N5x',
            'callback': (response: string) => this.onRecaptchaSuccess(response),
            'expired-callback': () => this.onRecaptchaExpired()
          });
        } catch (error) {
          console.error('Error al renderizar reCAPTCHA:', error);
          // Reintentar después de 200ms si hay error
          setTimeout(checkRecaptcha, 200);
        }
      } else {
        // Reintentar después de 100ms si reCAPTCHA o el elemento aún no están disponibles
        setTimeout(checkRecaptcha, 100);
      }
    };
    checkRecaptcha();
  }

  onRecaptchaSuccess(response: string) {
    this.recaptchaResponse = response;
    this.isRecaptchaValid = true;
    console.log('reCAPTCHA completado correctamente');
  }

  onRecaptchaExpired() {
    this.recaptchaResponse = '';
    this.isRecaptchaValid = false;
    console.log('reCAPTCHA expirado');
  }

  constructor(
    private fb: FormBuilder, 
    private cartService: CartServiceService,
    private budgetsService: BudgetsService,
    private productsService: ProductsService
  ) {
    // Inicializar el formulario de términos
    this.termsForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9\s]+$/)]],  // Solo números y espacios
      company: [''],  // Campo opcional
      address: [''],  // Campo opcional para dirección
      logo: [null],  // Campo opcional para archivo de logotipo
      acceptTerms: [false, Validators.requiredTrue],
      receiveOffers: [false]  // Checkbox opcional para ofertas
    });
  }

  ngOnInit() {
    console.log('🔄 [CART-COMPONENT] Inicializando carrito reactivo...');
    
    // Obtener productos del carrito inicialmente
    this.cartItems = this.cartService.getCartItems();
    
    // Validar y corregir cantidades para que cumplan con los mínimos
    this.cartService.validateCartQuantities();
    
    // Suscribirse a cambios reactivos del carrito
    this.cartItemsSubscription = this.cartService.cartItems$.subscribe(items => {
      console.log('🔄 [CART-COMPONENT] Actualización reactiva de productos:', items.length);
      this.cartItems = items;
    });
    
    this.totalUnitsSubscription = this.cartService.totalUnits$.subscribe(total => {
      console.log('🔄 [CART-COMPONENT] Actualización reactiva de total:', total);
      this.totalUnits = total;
    });
    
    // Actualizar total de unidades inicial
    this.updateTotalUnits();
    
    console.log('🔄 [CART-COMPONENT] Carrito reactivo inicializado con', this.cartItems.length, 'productos');
  }

  ngOnDestroy() {
    console.log('🔄 [CART-COMPONENT] Limpiando suscripciones del carrito...');
    
    // Limpiar suscripciones para evitar memory leaks
    if (this.cartItemsSubscription) {
      this.cartItemsSubscription.unsubscribe();
    }
    
    if (this.totalUnitsSubscription) {
      this.totalUnitsSubscription.unsubscribe();
    }
  }

  updateQuantity(index: number) {
    const inputElement = document.getElementById(`quantity-input-${index}`) as HTMLInputElement;
    const newQuantity = parseInt(inputElement.value) || 0;
    const product = this.cartItems[index];
    const minQuantity = this.getMinQuantity(product);
    
    console.log('📊 [CART] Actualizando cantidad para:', product.nombre || 'producto');
    console.log('📊 [CART] Nueva cantidad:', newQuantity, '| Mínima:', minQuantity);
    
    // Validar cantidad mínima
    if (newQuantity < minQuantity) {
      console.warn('⚠️ [CART] Cantidad menor al mínimo, ajustando a:', minQuantity);
      inputElement.value = minQuantity.toString();
      this.cartItems[index].quantity = minQuantity;
      
      // Mostrar mensaje al usuario
      alert(`La cantidad mínima para "${this.getProductName(product)}" es ${minQuantity} unidades.`);
    } else {
      this.cartItems[index].quantity = newQuantity;
    }
    
    this.updateTotalUnits();  // Actualiza el total de unidades
  }

  // Calcular el total de unidades
  // updateTotalUnits() {
  //   this.totalUnits = this.cartItems.reduce((acc, item) => acc + item.quantity, 0);
  // }

  updateTotalUnits() {
    this.totalUnits = this.cartService.getTotalUnits();
  }

  // Eliminar un producto del carrito
  removeItem(productId: any) {
    console.log('🗑️ [CART-COMPONENT] Eliminando producto con ID:', productId);
    
    const itemToRemove = this.cartItems.find(item => (item._id || item.id) === productId);
    if (itemToRemove) {
      console.log('🗑️ [CART-COMPONENT] Producto a eliminar:', itemToRemove.nombre || itemToRemove.name);
    }
    
    // Solo llamar al servicio - el sistema reactivo se encargará de actualizar la UI
    this.cartService.removeFromCart(productId);
    
    console.log('🗑️ [CART-COMPONENT] Eliminación solicitada - actualización reactiva en proceso...');
  }

  // Para manejar la subida de archivos
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('📁 [CART-COMPONENT] Archivo seleccionado:', file.name, file.size, 'bytes');
      
      // Validar tamaño del archivo (10MB máximo)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`⚠️ El archivo es demasiado grande (${sizeMB}MB).\n\nTamaño máximo permitido: 10MB\n\nPor favor, reduce el tamaño de la imagen o elige otro archivo.`);
        event.target.value = ''; // Limpiar el input
        return;
      }
      
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert(`⚠️ Tipo de archivo no permitido: ${file.type}\n\nTipos permitidos: JPG, PNG, SVG, WebP`);
        event.target.value = ''; // Limpiar el input
        return;
      }
      
      this.termsForm.patchValue({ logo: file });
      console.log('✅ [CART-COMPONENT] Archivo válido y listo para subir');
    }
  }



  // Validar formulario completo antes del envío
  validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar campos requeridos del formulario
    if (!this.termsForm.get('email')?.value?.trim()) {
      errors.push('El email es obligatorio');
    }

    if (!this.termsForm.get('name')?.value?.trim()) {
      errors.push('El nombre es obligatorio');
    }

    if (!this.termsForm.get('phone')?.value?.trim()) {
      errors.push('El teléfono es obligatorio');
    }

    // Validar formato de email
    const emailControl = this.termsForm.get('email');
    if (emailControl?.value && emailControl.hasError('email')) {
      errors.push('El formato del email no es válido');
    }

    // Validar formato de teléfono (solo números y espacios)
    const phoneControl = this.termsForm.get('phone');
    if (phoneControl?.value && phoneControl.hasError('pattern')) {
      errors.push('El teléfono solo puede contener números y espacios');
    }

    // Validar términos y condiciones
    if (!this.termsForm.get('acceptTerms')?.value) {
      errors.push('Debes aceptar los términos y condiciones');
    }

    // Validar reCAPTCHA (opcional durante pruebas)
    // if (!this.isRecaptchaValid) {
    //   errors.push('Por favor, completa la verificación reCAPTCHA');
    // }

    // Validar productos del carrito usando el servicio de presupuestos
    const productValidation = this.budgetsService.validateCartProducts(this.cartItems);
    if (!productValidation.isValid) {
      errors.push(...productValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Mostrar errores de validación
  showValidationErrors(errors: string[]) {
    let errorMessage = '❌ Por favor, corrige los siguientes errores:\n\n';
    errors.forEach((error, index) => {
      errorMessage += `${index + 1}. ${error}\n`;
    });
    alert(errorMessage);
  }

  // Manejar el envío del formulario
  onSubmit() {
    // Prevenir doble envío
    if (this.isSubmitting) {
      console.log('⚠️ [CART-COMPONENT] Envío ya en proceso, ignorando click adicional');
      return;
    }

    console.log('📋 [CART-COMPONENT] === INICIANDO ENVÍO DE PRESUPUESTO ===');
    
    // Marcar todos los campos como touched para mostrar errores visuales
    Object.keys(this.termsForm.controls).forEach(key => {
      this.termsForm.get(key)?.markAsTouched();
    });

    // Validar formulario completo
    const validation = this.validateForm();

    if (validation.isValid) {
      console.log('✅ [CART-COMPONENT] Validación exitosa, procediendo con envío');
      
      // Activar estado de envío
      this.isSubmitting = true;
      
      // Preparar datos del presupuesto
      this.createBudgetRequest();

    } else {
      // Mostrar errores de validación
      this.showValidationErrors(validation.errors);
      console.log('❌ [CART-COMPONENT] Errores de validación:', validation.errors);
    }
  }

  // Crear solicitud de presupuesto real
  private async createBudgetRequest() {
    try {
      console.log('💰 [CART-COMPONENT] === CREANDO PRESUPUESTO REAL ===');
      
      // Subir logotipo si existe
      let logoPath: string | undefined;
      const logoFile = this.termsForm.get('logo')?.value;
      
      if (logoFile) {
        console.log('📤 [CART-COMPONENT] Subiendo logotipo...');
        try {
          // Intentar subida normal primero
          const logoResponse = await firstValueFrom(this.budgetsService.uploadLogo(logoFile));
          logoPath = logoResponse?.imagePath;
          console.log('✅ [CART-COMPONENT] Logotipo subido (método normal):', logoPath);
        } catch (logoError) {
          console.warn('⚠️ [CART-COMPONENT] Error en subida normal, intentando base64...');
          console.warn('⚠️ [CART-COMPONENT] Error original:', logoError);
          
          try {
            // Fallback: usar método base64
            const logoBase64Response = await firstValueFrom(this.budgetsService.uploadLogoBase64(logoFile));
            logoPath = logoBase64Response?.imagePath;
            console.log('✅ [CART-COMPONENT] Logotipo subido (método base64):', logoPath);
          } catch (base64Error) {
            console.warn('⚠️ [CART-COMPONENT] Error también en base64:', base64Error);
            console.warn('⚠️ [CART-COMPONENT] Continuando sin logotipo...');
            // Continuar sin logotipo si ambos métodos fallan
          }
        }
      }
      
      // Preparar datos del presupuesto
      const budgetRequest: CreateBudgetRequest = {
        cliente: {
          email: this.termsForm.get('email')?.value?.trim(),
          nombre: this.termsForm.get('name')?.value?.trim(),
          telefono: this.termsForm.get('phone')?.value?.trim(),
          direccion: this.termsForm.get('address')?.value?.trim() || undefined,
          empresa: this.termsForm.get('company')?.value?.trim() || undefined,
          detalles: '' // Campo adicional si es necesario
        },
        productos: await this.budgetsService.enrichCartItemsWithPrices(this.cartItems),
        logotipoEmpresa: logoPath,
        aceptaCorreosPublicitarios: this.termsForm.get('receiveOffers')?.value || false,
        notas: 'Presupuesto creado desde el frontoffice',
        precioTotal: 0 // Se calculará en el backend
      };
      
      console.log('📋 [CART-COMPONENT] Datos del presupuesto preparados:', budgetRequest);
      
      // Enviar presupuesto al backend
      this.budgetsService.createBudget(budgetRequest).subscribe({
        next: (response) => {
          console.log('🎉 [CART-COMPONENT] === PRESUPUESTO CREADO EXITOSAMENTE ===');
          console.log('🎉 [CART-COMPONENT] Respuesta del backend:', response);
          
          // Desactivar estado de envío
          this.isSubmitting = false;
          
          this.handleSuccessfulBudgetCreation(response);
        },
        error: (error) => {
          console.error('❌ [CART-COMPONENT] === ERROR CREANDO PRESUPUESTO ===');
          console.error('❌ [CART-COMPONENT] Error completo:', error);
          
          // Desactivar estado de envío
          this.isSubmitting = false;
          
          this.handleBudgetCreationError(error);
        }
      });
      
    } catch (error) {
      console.error('❌ [CART-COMPONENT] Error inesperado:', error);
      // Desactivar estado de envío en caso de error inesperado
      this.isSubmitting = false;
      this.handleBudgetCreationError(error);
    }
  }

  // Preparar datos del formulario
  prepareFormData(): FormData {
    const formData = new FormData();

    // Datos del formulario
    formData.append('email', this.termsForm.get('email')?.value?.trim());
    formData.append('name', this.termsForm.get('name')?.value?.trim());
    formData.append('phone', this.termsForm.get('phone')?.value?.trim());
    formData.append('company', this.termsForm.get('company')?.value?.trim() || '');
    formData.append('address', this.termsForm.get('address')?.value?.trim() || '');
    formData.append('receiveOffers', this.termsForm.get('receiveOffers')?.value);
    formData.append('recaptchaResponse', this.recaptchaResponse);

    // Agregar archivo de logo si existe
    const logoFile = this.termsForm.get('logo')?.value;
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    // Agregar productos del carrito
    formData.append('cartItems', JSON.stringify(this.cartItems));
    formData.append('totalUnits', this.totalUnits.toString());

    return formData;
  }

  // Manejar creación exitosa de presupuesto real
  handleSuccessfulBudgetCreation(response: any) {
    console.log('🎉 [CART-COMPONENT] === PRESUPUESTO CREADO EXITOSAMENTE ===');
    console.log('🎉 [CART-COMPONENT] Respuesta completa:', response);
    
    // Resetear reCAPTCHA
    if (typeof grecaptcha !== 'undefined') {
      try {
        grecaptcha.reset();
      } catch (e) {
        console.warn('⚠️ [CART] Error reseteando reCAPTCHA:', e);
      }
    }
    this.isRecaptchaValid = false;
    this.recaptchaResponse = '';

    // Vaciar el carrito después del envío exitoso
    this.cartItems = [];
    this.cartService.clearCart(); // Limpiar también el servicio
    this.updateTotalUnits();

    // Mensaje de éxito con información del presupuesto creado
    const numeroPresupuesto = response.numeroPresupuesto || 'N/A';
    const clienteNombre = response.cliente?.nombre || this.termsForm.get('name')?.value;
    const clienteEmail = response.cliente?.email || this.termsForm.get('email')?.value;
    
    alert(`✅ ¡Presupuesto creado correctamente!\n\n` +
          `📋 Número de presupuesto: ${numeroPresupuesto}\n` +
          `👤 Cliente: ${clienteNombre}\n` +
          `📧 Email: ${clienteEmail}\n` +
          `🛒 Productos: ${response.productos?.length || this.cartItems.length} artículos\n` +
          `📅 Estado: ${response.estado || 'Pendiente'}\n\n` +
          'Hemos enviado una confirmación a tu email.\n' +
          'Nos pondremos en contacto contigo pronto para finalizar tu presupuesto.');

    // Resetear formulario después del envío exitoso
    this.resetForm();
  }

  // Manejar errores en la creación de presupuesto
  handleBudgetCreationError(error: any) {
    console.error('❌ [CART-COMPONENT] === ERROR EN CREACIÓN DE PRESUPUESTO ===');
    console.error('❌ [CART-COMPONENT] Error completo:', error);
    
    let errorMessage = '❌ Error al crear el presupuesto\n\n';
    
    if (error.status === 400 && error.error?.message) {
      // Error de validación del backend
      if (Array.isArray(error.error.message)) {
        errorMessage += 'Errores de validación:\n';
        error.error.message.forEach((msg: string, index: number) => {
          errorMessage += `${index + 1}. ${msg}\n`;
        });
      } else {
        errorMessage += `Error: ${error.error.message}\n`;
      }
    } else if (error.status === 0) {
      // Error de conexión
      errorMessage += 'No se pudo conectar con el servidor.\n';
      errorMessage += 'Por favor, verifica tu conexión a internet e inténtalo de nuevo.\n';
    } else if (error.status >= 500) {
      // Error del servidor
      errorMessage += 'Error interno del servidor.\n';
      errorMessage += 'Por favor, inténtalo de nuevo en unos minutos.\n';
    } else {
      // Otros errores
      errorMessage += `Error ${error.status}: ${error.statusText || 'Error desconocido'}\n`;
    }
    
    errorMessage += '\nSi el problema persiste, contacta con nuestro equipo de soporte.';
    
    alert(errorMessage);
    
    // Resetear reCAPTCHA para permitir reintento
    if (typeof grecaptcha !== 'undefined') {
      try {
        grecaptcha.reset();
      } catch (e) {
        console.warn('⚠️ [CART] Error reseteando reCAPTCHA:', e);
      }
    }
    this.isRecaptchaValid = false;
    this.recaptchaResponse = '';
  }

  // Manejar envío exitoso (método legacy - mantenido para compatibilidad)
  handleSuccessfulSubmission(formData: FormData) {
    console.log('✅ Formulario validado correctamente (método legacy)');
    console.log('📋 Datos del presupuesto:', {
      email: formData.get('email'),
      name: formData.get('name'),
      phone: formData.get('phone'),
      company: formData.get('company'),
      receiveOffers: formData.get('receiveOffers'),
      cartItems: JSON.parse(formData.get('cartItems') as string),
      totalUnits: formData.get('totalUnits')
    });

    // Este método ya no se usa, pero se mantiene para compatibilidad
    alert('✅ ¡Presupuesto enviado correctamente! (modo legacy)');
  }

  // Resetear formulario (opcional)
  resetForm() {
    this.termsForm.reset({
      email: '',
      name: '',
      phone: '',
      company: '',
      address: '',
      logo: null,
      acceptTerms: false,
      receiveOffers: false
    });

    // Resetear reCAPTCHA
    if (typeof grecaptcha !== 'undefined') {
      try {
        grecaptcha.reset();
      } catch (e) {
        console.warn('⚠️ [CART] Error reseteando reCAPTCHA:', e);
      }
    }
    this.isRecaptchaValid = false;
    this.recaptchaResponse = '';
  }

  // Métodos para manejo de productos en el carrito
  getProductImage(product: any): string {
    console.log('🖼️ [CART] Obteniendo imagen para producto:', product);
    
    if (product.imagenes && product.imagenes.length > 0) {
      let imagePath = product.imagenes[0];
      
      // Si la ruta ya incluye el dominio completo, usarla tal como está
      if (imagePath.startsWith('http')) {
        console.log('🖼️ [CART] Usando ruta completa:', imagePath);
        return imagePath;
      }
      
      // Si la ruta empieza con /uploads, añadir el dominio del backend
      if (imagePath.startsWith('/uploads')) {
        const fullPath = `http://localhost:3000${imagePath}`;
        console.log('🖼️ [CART] Ruta construida:', fullPath);
        return fullPath;
      }
      
      // Si no tiene prefijo, asumir que es una ruta relativa
      const fullPath = `http://localhost:3000/uploads/productos/${imagePath}`;
      console.log('🖼️ [CART] Ruta relativa construida:', fullPath);
      return fullPath;
    }
    
    console.log('🖼️ [CART] Sin imágenes, usando placeholder');
    return '/assets/images/placeholder-product.jpg';
  }

  getProductName(product: any): string {
    return product.nombre || product.name || 'Producto sin nombre';
  }

  onImageError(event: any): void {
    console.log('❌ [CART] Error cargando imagen:', event.target.src);
    event.target.src = '/assets/images/placeholder-product.jpg';
  }

  getMinQuantity(product: any): number {
    const minQty = product.cantidadMinima || product.minimumQuantity || 1;
    console.log('📊 [CART] Cantidad mínima para', product.nombre || 'producto', ':', minQty);
    return minQty;
  }
}
