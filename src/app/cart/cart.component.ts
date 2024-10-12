import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  cartItems = [
    { name: 'Growers Cider', description: 'Brief description', price: 12, image: 'assets/images/cider.jpg' },
    { name: 'Fresh Grapes', description: 'Brief description', price: 8, image: 'assets/images/grapes.jpg' },
    { name: 'Heinz Tomato Ketchup', description: 'Brief description', price: 5, image: 'assets/images/ketchup.jpg' }
  ];

  totalPrice: number = this.cartItems.reduce((acc, item) => acc + item.price, 0);

  termsForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.termsForm = this.fb.group({
      acceptTerms: [false, Validators.requiredTrue]
    });
  }

  onSubmit(): void {
    if (this.termsForm.valid) {
      alert('¡Presupuesto enviado correctamente!');
      // Aquí puedes agregar la lógica para enviar el presupuesto
    }
  }
}
