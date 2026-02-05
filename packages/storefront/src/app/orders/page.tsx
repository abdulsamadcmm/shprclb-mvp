"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ChevronRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/lib/api";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(cents / 100);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load orders from localStorage
    try {
      const storedOrders = localStorage.getItem("orders");
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-2xl mx-auto mt-12 text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">No orders yet</h1>
            <p className="text-muted-foreground">
              When you place orders, they will appear here
            </p>
          </div>
          <Link href="/">
            <Button size="lg">Start Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Your Orders</h1>
          <p className="text-muted-foreground">
            View and track your order history
          </p>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => {
            // Get unique warehouses count
            const warehouseSet = new Set(
              order.items
                .map((item) => item.metadata?.location_id)
                .filter(Boolean)
            );
            const warehouseCount = warehouseSet.size;

            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="bg-card rounded-lg border p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Side - Order Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <span className="font-semibold text-lg">
                            Order #{order.display_id}
                          </span>
                        </div>
                        <Badge variant="secondary">Placed</Badge>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Order Date</p>
                          <p className="font-medium">
                            {new Date(order.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Amount</p>
                          <p className="font-medium text-lg">
                            {formatPrice(order.total)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <span>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                        </div>
                        {warehouseCount > 1 && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {warehouseCount} warehouses
                            </span>
                          </>
                        )}
                      </div>

                      {/* Shipping Address Preview */}
                      <div className="text-sm">
                        <p className="text-muted-foreground">Delivering to</p>
                        <p className="font-medium">
                          {order.shipping_address.first_name}{" "}
                          {order.shipping_address.last_name}
                        </p>
                        <p className="text-muted-foreground">
                          {order.shipping_address.city},{" "}
                          {order.shipping_address.postal_code}
                        </p>
                      </div>
                    </div>

                    {/* Right Side - Action */}
                    <div className="flex items-center">
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
