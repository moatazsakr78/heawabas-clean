'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types';

// Define cart item interface
interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

// Define cart context interface
interface CartContextType {
  items: CartItem[];
  orderMode: boolean;
  isEditMode: boolean;
  toggleOrderMode: () => void;
  addItem: (product: Product, quantity: number, notes?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getItem: (productId: string) => CartItem | undefined;
  itemsCount: number;
}

// Create context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  orderMode: false,
  isEditMode: false,
  toggleOrderMode: () => {},
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  updateNotes: () => {},
  clearCart: () => {},
  isInCart: () => false,
  getItem: () => undefined,
  itemsCount: 0,
});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderMode, setOrderMode] = useState(false);
  const [itemsCount, setItemsCount] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
    
    // Check if we're in edit mode
    const editOrderId = localStorage.getItem('editOrderId');
    setIsEditMode(!!editOrderId);
  }, []);

  // Update localStorage when cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
    
    // Update items count - now counting unique items instead of total quantity
    const count = items.length;
    setItemsCount(count);
  }, [items]);

  // Check edit mode when local storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const editOrderId = localStorage.getItem('editOrderId');
      setIsEditMode(!!editOrderId);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Toggle order mode
  const toggleOrderMode = () => {
    setOrderMode(!orderMode);
  };

  // Add item to cart
  const addItem = (product: Product, quantity: number, notes?: string) => {
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(
        item => item.product.id === product.id
      );

      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
          notes: notes || updatedItems[existingItemIndex].notes
        };
        return updatedItems;
      } else {
        // Add new item
        return [...currentItems, { product, quantity, notes }];
      }
    });
  };

  // Remove item from cart
  const removeItem = (productId: string) => {
    setItems(currentItems => 
      currentItems.filter(item => item.product.id !== productId)
    );
  };

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    setItems(currentItems => 
      currentItems.map(item => 
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Update item notes
  const updateNotes = (productId: string, notes: string) => {
    setItems(currentItems => 
      currentItems.map(item => 
        item.product.id === productId
          ? { ...item, notes }
          : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
    // Also clear edit mode if we're clearing the cart
    if (isEditMode) {
      localStorage.removeItem('editOrderId');
      setIsEditMode(false);
    }
  };

  // Check if product is in cart
  const isInCart = (productId: string) => {
    return items.some(item => item.product.id === productId);
  };

  // Get cart item by product id
  const getItem = (productId: string) => {
    return items.find(item => item.product.id === productId);
  };

  return (
    <CartContext.Provider value={{
      items,
      orderMode,
      isEditMode,
      toggleOrderMode,
      addItem,
      removeItem,
      updateQuantity,
      updateNotes,
      clearCart,
      isInCart,
      getItem,
      itemsCount
    }}>
      {children}
    </CartContext.Provider>
  );
}; 