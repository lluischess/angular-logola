import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

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
      { name: 'Growers Cider', description: 'Brief description', referencia: '12345', image: 'path/to/image', quantity: 0 },
      { name: 'Fresh Grapes', description: 'Brief description', referencia: '12345', image: 'path/to/image', quantity: 0 },
      { name: 'Heinz Tomato Ketchup', description: 'Brief description', referencia: '12345', image: 'path/to/image', quantity: 0 }
    ];
  }

  ngOnInit() {
    // Simula la carga del carrito con productos y añade el showExplanation en false
    this.cartItems = this.getCartItems().map(item => ({
      ...item,
      showExplanation: false,  // Añadimos la propiedad para manejar el tooltip de cada producto
      sliderValue: 1  // Inicializa el slider con un valor por defecto
    }));
    this.updateTotalUnits();  // Inicializa el total de unidades
  }

  constructor(private fb: FormBuilder) {
    // Inicializar el formulario de términos
    this.termsForm = this.fb.group({
      acceptTerms: [false, Validators.requiredTrue]
    });
  }

  // Actualizar el valor del slider
  updateSliderValue(index: number, event: any) {
    this.cartItems[index].sliderValue = event.target.value;
  }

  updateQuantity(index: number) {
    // Asigna el valor actual del input a la cantidad del producto
    this.cartItems[index].quantity = parseInt((document.getElementById(`quantity-input-${index}`) as HTMLInputElement).value);
    this.updateTotalUnits();  // Actualiza el total de unidades
  }

  // Calcular el total de unidades
  updateTotalUnits() {
    this.totalUnits = this.cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }

  removeItem(index: number) {
    this.cartItems.splice(index, 1);
    this.updateTotalUnits(); // Actualiza el total de unidades después de eliminar el producto
  }

  toggleExplanation(index: number) {
    this.cartItems[index].showExplanation = !this.cartItems[index].showExplanation;
  }

  // Manejar el envío del formulario
  onSubmit() {
    if (this.termsForm.valid) {
      // Lógica para enviar presupuesto
      console.log('Formulario enviado');
    }
  }
}
