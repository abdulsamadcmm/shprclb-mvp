"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { meetsMOQ } from "@/lib/moq-utils";

export interface CartLineItem {
  id: string; // unique line item id
  variant_id: string;
  warehouse_price_id: string;
  location_id: string;
  location_name: string;
  quantity: number;
  product_title: string;
  variant_title: string;
  variant_sku: string | null;
  thumbnail: string | null;
  // Pricing snapshot
  unit_price: number;
  total_price: number;
  currency_code: string;
  tier_applied: boolean;
  tier_name: string;
  moq: number; // Minimum order quantity
}

interface CartContextType {
  items: CartLineItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartLineItem, "id">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemPricing: (
    itemId: string,
    pricing: {
      unit_price: number;
      total_price: number;
      tier_applied: boolean;
      tier_name: string;
    }
  ) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "shprclb_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed);
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error("Failed to save cart to localStorage:", error);
      }
    }
  }, [items, isLoaded]);

  const addItem = (newItem: Omit<CartLineItem, "id">) => {
    // Validate MOQ
    if (!meetsMOQ(newItem.quantity, newItem.moq)) {
      console.error(`Minimum order quantity is ${newItem.moq}`);
      throw new Error(`Minimum order quantity is ${newItem.moq}`);
    }

    setItems((currentItems) => {
      // Check if item with same variant + warehouse already exists
      const existingIndex = currentItems.findIndex(
        (item) =>
          item.variant_id === newItem.variant_id &&
          item.warehouse_price_id === newItem.warehouse_price_id
      );

      if (existingIndex >= 0) {
        // Update quantity of existing item
        const updated = [...currentItems];
        const newQuantity = updated[existingIndex].quantity + newItem.quantity;
        
        // Ensure combined quantity still meets MOQ
        if (!meetsMOQ(newQuantity, newItem.moq)) {
          console.error(`Combined quantity must meet minimum order of ${newItem.moq}`);
          return currentItems; // Don't update if MOQ not met
        }
        
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQuantity,
          // Pricing will be recalculated by the component
        };
        return updated;
      }

      // Add new item with unique ID
      const id = `${newItem.variant_id}-${newItem.warehouse_price_id}-${Date.now()}`;
      return [...currentItems, { ...newItem, id }];
    });
  };

  const removeItem = (itemId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId)
    );
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setItems((currentItems) => {
      const item = currentItems.find((i) => i.id === itemId);
      
      if (!item) return currentItems;
      
      // If quantity is below MOQ, remove the item
      if (quantity < item.moq) {
        return currentItems.filter((i) => i.id !== itemId);
      }

      return currentItems.map((i) =>
        i.id === itemId ? { ...i, quantity } : i
      );
    });
  };

  const updateItemPricing = (
    itemId: string,
    pricing: {
      unit_price: number;
      total_price: number;
      tier_applied: boolean;
      tier_name: string;
    }
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              unit_price: pricing.unit_price,
              total_price: pricing.total_price,
              tier_applied: pricing.tier_applied,
              tier_name: pricing.tier_name,
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        updateItemPricing,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
