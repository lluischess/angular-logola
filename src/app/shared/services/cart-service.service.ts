import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartServiceService {

  private cartItems: any[] = [];

  // Obtener los productos en el carrito
  getCartItems() {
    return this.cartItems;
  }

  // Añadir un producto al carrito
  addToCart(product: any) {
    const existingItem = this.cartItems.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;  // Si el producto ya está, se incrementa la cantidad
    } else {
      this.cartItems.push({ ...product, quantity: 1 });  // Si no, se añade con cantidad 1
    }
  }

  // Eliminar un producto del carrito
  removeFromCart(productId: number) {
    this.cartItems = this.cartItems.filter(item => item.id !== productId);
  }

  // Obtener el total de unidades
  getTotalUnits() {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }
}
