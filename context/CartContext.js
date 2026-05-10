'use client';
// context/CartContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('luxe_cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('luxe_cart', JSON.stringify(cart));
  }, [cart]);

  // Cart key = productId + size combo for variant support
  function getCartKey(productId, size) {
    return `${productId}__${size || 'default'}`;
  }

  function addToCart(product, quantity = 1, selectedSize = null) {
    const size = selectedSize || product.size || 'default';
    const cartKey = getCartKey(product.id, size);

    // Find variant data if available
    const variant = product.variants?.find(v => v.size === size);
    const price = variant ? variant.price : product.price;
    const stock = variant ? variant.stock : product.stock;
    const image = variant?.images?.[0] || product.image;

    setCart(prev => {
      const existing = prev.find(i => i.cartKey === cartKey);
      if (existing) {
        return prev.map(i =>
          i.cartKey === cartKey
            ? { ...i, quantity: Math.min(i.quantity + quantity, stock) }
            : i
        );
      }
      return [...prev, {
        cartKey,
        productId: product.id,
        name: product.name,
        price,
        image,
        stock,
        size,
        quantity,
      }];
    });
  }

  function removeFromCart(cartKey) {
    setCart(prev => prev.filter(i => i.cartKey !== cartKey));
  }

  function updateQuantity(cartKey, quantity) {
    if (quantity <= 0) {
      removeFromCart(cartKey);
      return;
    }
    setCart(prev => prev.map(i =>
      i.cartKey === cartKey ? { ...i, quantity: Math.min(quantity, i.stock) } : i
    ));
  }

  function clearCart() {
    setCart([]);
  }

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
