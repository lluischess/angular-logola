import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule,FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  cartItems: any[] = [];
  termsForm: FormGroup;

  getCartItems() {
    // Función que retorna los items del carrito (ejemplo)
    return [
      { name: 'Growers Cider', description: 'Brief description', price: 12, image: 'path/to/image', quantity: 1 },
      { name: 'Fresh Grapes', description: 'Brief description', price: 8, image: 'path/to/image', quantity: 1 },
      { name: 'Heinz Tomato Ketchup', description: 'Brief description', price: 5, image: 'path/to/image', quantity: 1 }
    ];
  }

  totalPrice: number = 0;


  ngOnInit() {
    // Simula la carga del carrito con productos y añade el showExplanation en false
    this.cartItems = this.getCartItems().map(item => ({
      ...item,
      showExplanation: false  // Añadimos la propiedad para manejar el tooltip de cada producto
    }));
  }



  constructor(private fb: FormBuilder) {
    // Inicializar el formulario de términos
    this.termsForm = this.fb.group({
      acceptTerms: [false, Validators.requiredTrue]
    });
    this.updateTotalPrice();
  }

  // Actualizar el valor del slider
updateSliderValue(index: number, event: any) {
  this.cartItems[index].sliderValue = event.target.value;
  this.updateTotalPrice();
}

// Calcular el precio total con la cantidad seleccionada en el slider
updateTotalPrice() {
  this.totalPrice = this.cartItems.reduce((acc, item) => acc + (item.price * item.sliderValue), 0);
}

removeItem(index: number) {
  this.cartItems.splice(index, 1);
  this.updateTotalPrice(); // Actualiza el precio total después de eliminar el producto
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
