"use client";

import Link from "next/link";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/cart-context";
import { CartLineItemComponent } from "@/components/cart/cart-line-item";

function formatPrice(cents: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
  }).format(cents / 100);
}

export default function CartPage() {
  const { items, itemCount, subtotal, removeItem, updateQuantity, updateItemPricing, clearCart } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to products
        </Link>

        <div className="max-w-2xl mx-auto mt-12 text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Your cart is empty</h1>
            <p className="text-muted-foreground">
              Start adding products to your cart to see them here
            </p>
          </div>
          <Link href="/">
            <Button size="lg">Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get currency from first item (assume single currency for MVP)
  const currencyCode = items[0]?.currency_code || "INR";

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-4 mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Continue shopping
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-muted-foreground mt-1">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearCart}>
            Clear cart
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-lg border p-4">
            {items.map((item) => (
              <CartLineItemComponent
                key={item.id}
                item={item}
                onRemove={removeItem}
                onQuantityChange={updateQuantity}
                onPricingUpdate={updateItemPricing}
              />
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border p-6 space-y-4 sticky top-24">
            <h2 className="text-lg font-semibold">Order Summary</h2>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal, currencyCode)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-muted-foreground">
                  Calculated at checkout
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-muted-foreground">
                  Calculated at checkout
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatPrice(subtotal, currencyCode)}</span>
            </div>

            <Button size="lg" className="w-full" disabled>
              Proceed to Checkout
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Checkout flow coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
