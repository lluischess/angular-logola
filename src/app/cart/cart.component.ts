import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartServiceService } from '../shared/services/cart-service.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']  // Cambié styleUrl a styleUrls
})
export class CartComponent {
  cartItems: any[] = [];
  termsForm: FormGroup;
  totalUnits: number = 0;  // Variable para total de unidades

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

  constructor(private fb: FormBuilder, private cartService: CartServiceService) {
    // Inicializar el formulario de términos
    this.termsForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      company: [''],  // Campo opcional
      logo: [null],  // Campo opcional para archivo de logotipo
      acceptTerms: [false, Validators.requiredTrue]
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

  // Manejar el envío del formulario
  onSubmit() {
    if (this.termsForm.valid) {
      const formData = new FormData();
      formData.append('email', this.termsForm.get('email')?.value);
      formData.append('name', this.termsForm.get('name')?.value);
      formData.append('company', this.termsForm.get('company')?.value || '');
      formData.append('logo', this.termsForm.get('logo')?.value);

      // Aquí puedes manejar el envío del formulario, por ejemplo, con una petición HTTP.
      console.log('Formulario enviado', formData);
    } else {
      console.log('Formulario no válido');
    }
  }
}
