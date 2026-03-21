import React, { createContext, useState, useContext, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = '@quickgift_cart';
const CartContext = createContext({});

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const isLoaded = useRef(false);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        }
      } catch (err) {
        console.log('Error loading cart:', err);
      } finally {
        isLoaded.current = true;
      }
    };
    loadCart();
  }, []);

  // Persist cart to AsyncStorage whenever it changes
  useEffect(() => {
    if (!isLoaded.current) return;
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (err) {
        console.log('Error saving cart:', err);
      }
    };
    saveCart();
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const MAX_QUANTITY = 20;

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    if (quantity > MAX_QUANTITY) return; // Cap at 20
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: Math.min(quantity, MAX_QUANTITY) } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

export default CartContext;
