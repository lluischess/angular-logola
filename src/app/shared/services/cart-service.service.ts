import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartServiceService {

  private cartItems: any[] = [];
  private cartItemsSubject = new BehaviorSubject<any[]>([]);
  private totalUnitsSubject = new BehaviorSubject<number>(0);

  // Observables públicos para que los componentes se suscriban
  public cartItems$ = this.cartItemsSubject.asObservable();
  public totalUnits$ = this.totalUnitsSubject.asObservable();

  // Obtener los productos en el carrito
  getCartItems() {
    return this.cartItems;
  }

  // Añadir un producto al carrito
  addToCart(product: any) {
    console.log('🛒 [CART-SERVICE] === AÑADIENDO PRODUCTO AL CARRITO ===');
    console.log('🛒 [CART-SERVICE] Producto completo:', product);
    console.log('🛒 [CART-SERVICE] ID del producto:', product.id);
    console.log('🛒 [CART-SERVICE] _id del producto:', product._id);
    console.log('🛒 [CART-SERVICE] Nombre del producto:', product.nombre || product.name);
    console.log('🛒 [CART-SERVICE] Referencia del producto:', product.referencia);
    
    // Obtener la cantidad mínima del producto
    const minQuantity = this.getMinQuantity(product);
    console.log('🛒 [CART-SERVICE] Cantidad mínima requerida:', minQuantity);
    
    // Mostrar productos actuales en el carrito para debugging
    console.log('🛒 [CART-SERVICE] Productos actuales en carrito:', this.cartItems.length);
    this.cartItems.forEach((item, index) => {
      console.log(`🛒 [CART-SERVICE] Item ${index}: id=${item.id}, _id=${item._id}, nombre=${item.nombre || item.name}`);
    });
    
    // Intentar encontrar el producto usando diferentes identificadores
    const existingItemById = this.cartItems.find(item => item.id === product.id);
    const existingItemBy_Id = this.cartItems.find(item => item._id === product._id);
    const existingItemByRef = this.cartItems.find(item => item.referencia === product.referencia);
    
    console.log('🛒 [CART-SERVICE] Búsqueda por id:', existingItemById ? 'ENCONTRADO' : 'NO ENCONTRADO');
    console.log('🛒 [CART-SERVICE] Búsqueda por _id:', existingItemBy_Id ? 'ENCONTRADO' : 'NO ENCONTRADO');
    console.log('🛒 [CART-SERVICE] Búsqueda por referencia:', existingItemByRef ? 'ENCONTRADO' : 'NO ENCONTRADO');
    
    // Usar _id como identificador principal (MongoDB), fallback a id si no existe _id
    const productId = product._id || product.id;
    const existingItem = this.cartItems.find(item => (item._id || item.id) === productId);
    
    if (existingItem) {
      // Si el producto ya está, incrementar por la cantidad mínima
      existingItem.quantity += minQuantity;
      console.log('🛒 [CART-SERVICE] Producto existente encontrado, nueva cantidad:', existingItem.quantity);
    } else {
      // Si no existe, añadir con la cantidad mínima
      const newItem = { ...product, quantity: minQuantity };
      this.cartItems.push(newItem);
      console.log('🛒 [CART-SERVICE] Nuevo producto añadido con cantidad:', minQuantity);
      console.log('🛒 [CART-SERVICE] Total productos en carrito:', this.cartItems.length);
    }
    
    // Notificar cambios a los componentes suscritos
    this.notifyCartChanges();
  }

  // Eliminar un producto del carrito
  removeFromCart(productId: any) {
    console.log('🗑️ [CART-SERVICE] Eliminando producto con ID:', productId);
    console.log('🗑️ [CART-SERVICE] Productos antes de eliminar:', this.cartItems.length);
    
    // Usar el mismo criterio de identificación que addToCart
    this.cartItems = this.cartItems.filter(item => {
      const itemId = item._id || item.id;
      return itemId !== productId;
    });
    
    console.log('🗑️ [CART-SERVICE] Productos después de eliminar:', this.cartItems.length);
    
    // Notificar cambios a los componentes suscritos
    this.notifyCartChanges();
  }

  // Obtener el total de unidades
  getTotalUnits() {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  // Limpiar completamente el carrito
  clearCart() {
    console.log('🧹 [CART-SERVICE] Limpiando carrito completo');
    this.cartItems = [];
    
    // Notificar cambios a los componentes suscritos
    this.notifyCartChanges();
  }

  // Obtener la cantidad mínima de un producto
  private getMinQuantity(product: any): number {
    const minQty = product.cantidadMinima || product.minimumQuantity || 1;
    console.log('📊 [CART-SERVICE] Cantidad mínima para', product.nombre || 'producto', ':', minQty);
    return minQty;
  }

  // Validar y corregir las cantidades del carrito para que cumplan con los mínimos
  validateCartQuantities() {
    console.log('✅ [CART-SERVICE] Validando cantidades del carrito...');
    
    this.cartItems.forEach(item => {
      const minQuantity = this.getMinQuantity(item);
      if (item.quantity < minQuantity) {
        console.log(`⚠️ [CART-SERVICE] Ajustando cantidad de "${item.nombre || 'producto'}" de ${item.quantity} a ${minQuantity}`);
        item.quantity = minQuantity;
      }
    });
  }

  // Método privado para notificar cambios en el carrito
  private notifyCartChanges() {
    console.log('🔔 [CART-SERVICE] Notificando cambios del carrito');
    console.log('🔔 [CART-SERVICE] Total productos:', this.cartItems.length);
    console.log('🔔 [CART-SERVICE] Total unidades:', this.getTotalUnits());
    
    // Actualizar los BehaviorSubjects para notificar a los componentes suscritos
    this.cartItemsSubject.next([...this.cartItems]);
    this.totalUnitsSubject.next(this.getTotalUnits());
  }
}
