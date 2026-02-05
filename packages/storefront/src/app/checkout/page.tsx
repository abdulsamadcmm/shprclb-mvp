"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, CreditCard, DollarSign, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/cart-context";
import { createOrder, type ShippingAddress } from "@/lib/api";

function formatPrice(cents: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
  }).format(cents / 100);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    address_1: "",
    address_2: "",
    city: "",
    postal_code: "",
    country_code: "gb", // Using GB (United Kingdom) as it's in the Europe region
    phone: "",
    payment_method: "credit_card",
  });

  const currencyCode = items[0]?.currency_code || "INR";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const shippingAddress: ShippingAddress = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        address_1: formData.address_1,
        address_2: formData.address_2,
        city: formData.city,
        country_code: formData.country_code,
        postal_code: formData.postal_code,
        phone: formData.phone,
      };

      const orderItems = items.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        warehouse_price_id: item.warehouse_price_id,
        location_id: item.location_id,
        location_name: item.location_name,
        moq: item.moq,
        product_title: item.product_title,
        variant_title: item.variant_title,
        thumbnail: item.thumbnail || undefined,
      }));

      const order = await createOrder({
        email: formData.email,
        shipping_address: shippingAddress,
        payment_method: formData.payment_method,
        items: orderItems,
      });

      // Store order in localStorage
      const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      existingOrders.unshift(order);
      localStorage.setItem("orders", JSON.stringify(existingOrders));

      // Clear cart
      clearCart();

      // Redirect to success page
      router.push(`/checkout/success?order_id=${order.id}`);
    } catch (err) {
      console.error("Failed to create order:", err);
      setError(err instanceof Error ? err.message : "Failed to create order");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground">
            Add items to your cart before proceeding to checkout
          </p>
          <Link href="/">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-4 mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to cart
        </Link>
        <h1 className="text-3xl font-bold">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <h2 className="text-lg font-semibold">Contact Information</h2>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <h2 className="text-lg font-semibold">Shipping Address</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Address <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="address_1"
                  value={formData.address_1}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Apartment, suite, etc. (optional)
                </label>
                <input
                  type="text"
                  name="address_2"
                  value={formData.address_2}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    City <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Postal Code <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Country <span className="text-destructive">*</span>
                  </label>
                  <select
                    name="country_code"
                    value={formData.country_code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="gb">United Kingdom</option>
                    <option value="fr">France</option>
                    <option value="de">Germany</option>
                    <option value="it">Italy</option>
                    <option value="es">Spain</option>
                    <option value="se">Sweden</option>
                    <option value="dk">Denmark</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <h2 className="text-lg font-semibold">Payment Method</h2>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="credit_card"
                    checked={formData.payment_method === "credit_card"}
                    onChange={handleInputChange}
                    className="w-4 h-4"
                  />
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Credit Card</span>
                </label>

                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="paypal"
                    checked={formData.payment_method === "paypal"}
                    onChange={handleInputChange}
                    className="w-4 h-4"
                  />
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">PayPal</span>
                </label>

                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash_on_delivery"
                    checked={formData.payment_method === "cash_on_delivery"}
                    onChange={handleInputChange}
                    className="w-4 h-4"
                  />
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Cash on Delivery</span>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-6 space-y-4 sticky top-24">
              <h2 className="text-lg font-semibold">Order Summary</h2>

              <Separator />

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="w-16 h-16 flex-shrink-0 rounded bg-muted overflow-hidden">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.product_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product_title}</p>
                      <p className="text-xs text-muted-foreground">{item.variant_title}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatPrice(item.total_price, item.currency_code)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal, currencyCode)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-emerald-600">Free</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(subtotal, currencyCode)}</span>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Place Order"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
