"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrder, type Order } from "@/lib/api";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      // Try to get order from localStorage first
      const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      const localOrder = existingOrders.find((o: Order) => o.id === orderId);
      
      if (localOrder) {
        setOrder(localOrder);
        setLoading(false);
      } else {
        // Fallback to API
        getOrder(orderId)
          .then((fetchedOrder) => {
            setOrder(fetchedOrder);
            setLoading(false);
          })
          .catch((error) => {
            console.error("Failed to fetch order:", error);
            setLoading(false);
          });
      }
    } else {
      setLoading(false);
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Order not found</h1>
          <p className="text-muted-foreground">
            We couldn't find your order details.
          </p>
          <Link href="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Order Placed Successfully!</h1>
            <p className="text-lg text-muted-foreground">
              Thank you for your order
            </p>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-xl font-bold">#{order.display_id}</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{order.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-medium">
                {new Date(order.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Shipping Address</p>
            <div className="text-sm">
              <p className="font-medium">
                {order.shipping_address.first_name} {order.shipping_address.last_name}
              </p>
              <p>{order.shipping_address.address_1}</p>
              {order.shipping_address.address_2 && (
                <p>{order.shipping_address.address_2}</p>
              )}
              <p>
                {order.shipping_address.city}, {order.shipping_address.postal_code}
              </p>
              {order.shipping_address.phone && (
                <p className="mt-1">Phone: {order.shipping_address.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold">Order Summary</h2>
          
          <div className="space-y-3">
            {order.items.map((item) => {
              const itemTotal = item.metadata?.total_price || item.total;
              return (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium">
                      {item.metadata?.product_title || item.title}
                    </p>
                    <p className="text-muted-foreground">
                      {item.metadata?.variant_title} × {item.quantity}
                    </p>
                    {item.metadata?.location_name && (
                      <p className="text-xs text-muted-foreground">
                        From: {item.metadata.location_name}
                      </p>
                    )}
                  </div>
                  <p className="font-medium">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(itemTotal / 100)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t space-y-2">
            {(() => {
              const calculatedSubtotal = order.items.reduce((sum, item) => {
                return sum + (item.metadata?.total_price || item.total);
              }, 0);
              
              return (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(calculatedSubtotal / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-emerald-600">Free</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span>
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(calculatedSubtotal / 100)}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={`/orders/${order.id}`} className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              View Order Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button size="lg" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>You will receive an order confirmation email shortly.</p>
          <p className="mt-1">
            Questions? Visit our <Link href="/" className="text-foreground hover:underline">Help Center</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
