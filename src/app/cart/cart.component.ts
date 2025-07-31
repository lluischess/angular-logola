import { CommonModule } from '@angular/common';
import { Component, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartServiceService } from '../shared/services/cart-service.service';

// Declarar grecaptcha para TypeScript
declare var grecaptcha: any;

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']  // Cambié styleUrl a styleUrls
})
export class CartComponent implements AfterViewInit {
  cartItems: any[] = [];
  termsForm: FormGroup;
  totalUnits: number = 0;  // Variable para total de unidades
  isRecaptchaValid: boolean = false;
  recaptchaResponse: string = '';

  getCartItems() {
    // Función que retorna los items del carrito (ejemplo)
    return [
      { name: 'BOMBÓN NAVIDAD EN BOLSA UNITARIA PERSONALIZADA', referencia: 'BE-015-156', image: 'assets/images/BE-015-156.jpg', quantity: 0 },
      { name: 'Botes de Logolate', referencia: 'EN-130-b-&-EN-170', image: 'assets/images/EN-130-b-y-EN-170.jpg', quantity: 0 },
      { name: 'BOTES PET CON DULCES NAVIDEÑOS', referencia: 'EN-130G-175', image: 'assets/images/EN-130G-175.jpg', quantity: 0 }
    ];
  }

  ngOnInit() {
    // Simula la carga del carrito con productos y añade el showExplanation en false
    // this.cartItems = this.getCartItems().map(item => ({
    //   ...item,
    //   showExplanation: false,  // Añadimos la propiedad para manejar el tooltip de cada producto
    //   sliderValue: 1  // Inicializa el slider con un valor por defecto
    // }));
    this.cartItems = this.cartService.getCartItems();
    this.updateTotalUnits();  // Inicializa el total de unidades
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

  constructor(private fb: FormBuilder, private cartService: CartServiceService) {
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



  updateQuantity(index: number) {
    // Asigna el valor actual del input a la cantidad del producto
    this.cartItems[index].quantity = parseInt((document.getElementById(`quantity-input-${index}`) as HTMLInputElement).value);
    this.updateTotalUnits();  // Actualiza el total de unidades
  }

  // Calcular el total de unidades
  // updateTotalUnits() {
  //   this.totalUnits = this.cartItems.reduce((acc, item) => acc + item.quantity, 0);
  // }

  updateTotalUnits() {
    this.totalUnits = this.cartService.getTotalUnits();
  }

  // removeItem(index: number) {
  //   this.cartItems.splice(index, 1);
  //   this.updateTotalUnits(); // Actualiza el total de unidades después de eliminar el producto
  // }

  removeItem(productId: number) {
    this.cartService.removeFromCart(productId);
    this.cartItems = this.cartService.getCartItems();
    this.updateTotalUnits();
  }



  // Para manejar la subida de archivos
  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.termsForm.patchValue({
        logo: file
      });
    }
  }



  // Validar formulario completo antes del envío
  validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar email
    const email = this.termsForm.get('email');
    if (!email?.value) {
      errors.push('El email es obligatorio');
    } else if (email.invalid) {
      errors.push('El formato del email no es válido');
    }

    // Validar nombre
    const name = this.termsForm.get('name');
    if (!name?.value) {
      errors.push('El nombre es obligatorio');
    } else if (name.value.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    // Validar teléfono
    const phone = this.termsForm.get('phone');
    if (!phone?.value) {
      errors.push('El teléfono es obligatorio');
    } else if (phone.invalid) {
      errors.push('El teléfono solo puede contener números y espacios');
    } else if (phone.value.replace(/\s/g, '').length < 9) {
      errors.push('El teléfono debe tener al menos 9 dígitos');
    }

    // Validar términos
    const acceptTerms = this.termsForm.get('acceptTerms');
    if (!acceptTerms?.value) {
      errors.push('Debes aceptar los términos para continuar');
    }

    // Validar reCAPTCHA
    if (!this.isRecaptchaValid) {
      errors.push('Por favor, completa la verificación reCAPTCHA');
    }

    // Validar que hay productos en el carrito
    if (this.cartItems.length === 0) {
      errors.push('No hay productos en el carrito para solicitar presupuesto');
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
    // Marcar todos los campos como touched para mostrar errores visuales
    Object.keys(this.termsForm.controls).forEach(key => {
      this.termsForm.get(key)?.markAsTouched();
    });

    // Validar formulario completo
    const validation = this.validateForm();

    if (validation.isValid) {
      // Preparar datos para envío
      const formData = this.prepareFormData();

      // Simular envío exitoso (aquí se conectará al backend más adelante)
      this.handleSuccessfulSubmission(formData);

    } else {
      // Mostrar errores de validación
      this.showValidationErrors(validation.errors);
      console.log('Errores de validación:', validation.errors);
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

  // Manejar envío exitoso
  handleSuccessfulSubmission(formData: FormData) {
    console.log('✅ Formulario validado correctamente');
    console.log('📋 Datos del presupuesto:', {
      email: formData.get('email'),
      name: formData.get('name'),
      phone: formData.get('phone'),
      company: formData.get('company'),
      receiveOffers: formData.get('receiveOffers'),
      cartItems: JSON.parse(formData.get('cartItems') as string),
      totalUnits: formData.get('totalUnits')
    });

    // Resetear reCAPTCHA
    if (typeof grecaptcha !== 'undefined') {
      grecaptcha.reset();
    }
    this.isRecaptchaValid = false;
    this.recaptchaResponse = '';

    // Mensaje de éxito
    alert('✅ ¡Presupuesto enviado correctamente!\n\nHemos recibido tu solicitud con los siguientes datos:\n' +
          `📧 Email: ${formData.get('email')}\n` +
          `👤 Nombre: ${formData.get('name')}\n` +
          `📞 Teléfono: ${formData.get('phone')}\n` +
          `🛒 Productos: ${this.cartItems.length} artículos\n\n` +
          'Nos pondremos en contacto contigo pronto.');

    // Opcional: Limpiar formulario después del envío exitoso
    // this.resetForm();
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
      grecaptcha.reset();
    }
    this.isRecaptchaValid = false;
    this.recaptchaResponse = '';
  }
}
