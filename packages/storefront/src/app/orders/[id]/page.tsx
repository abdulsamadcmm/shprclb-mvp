"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Package, MapPin, Calendar, Mail, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WarehouseFulfillment } from "@/components/orders/warehouse-fulfillment";
import { getOrder, type Order, type OrderLineItem } from "@/lib/api";

interface WarehouseGroup {
  location_name: string;
  location_id: string;
  items: OrderLineItem[];
  subtotal: number;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(cents / 100);
}

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      // Try localStorage first
      const storedOrders = localStorage.getItem("orders");
      if (storedOrders) {
        try {
          const orders = JSON.parse(storedOrders);
          const foundOrder = orders.find((o: Order) => o.id === orderId);
          if (foundOrder) {
            setOrder(foundOrder);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Failed to parse stored orders:", err);
        }
      }

      // Fallback to API
      getOrder(orderId)
        .then((fetchedOrder) => {
          setOrder(fetchedOrder);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch order:", err);
          setError("Failed to load order details");
          setLoading(false);
        });
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

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Order Not Found</h1>
          <p className="text-muted-foreground">
            {error || "We couldn't find the order you're looking for."}
          </p>
          <Link
            href="/orders"
            className="inline-flex items-center text-sm text-primary hover:underline"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  // Group items by warehouse
  const warehouseGroups: Record<string, WarehouseGroup> = {};
  order.items.forEach((item) => {
    const locationId = item.metadata?.location_id || "unknown";
    const locationName = item.metadata?.location_name || "Unknown Warehouse";

    if (!warehouseGroups[locationId]) {
      warehouseGroups[locationId] = {
        location_id: locationId,
        location_name: locationName,
        items: [],
        subtotal: 0,
      };
    }

    warehouseGroups[locationId].items.push(item);
    warehouseGroups[locationId].subtotal += item.total;
  });

  const warehouseGroupArray = Object.values(warehouseGroups);
  const multiWarehouse = warehouseGroupArray.length > 1;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link
            href="/orders"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to orders
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">Order #{order.display_id}</h1>
              <p className="text-muted-foreground mt-1">
                Placed on{" "}
                {new Date(order.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <Badge variant="secondary" className="text-base px-4 py-2">
              Placed
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Multi-Warehouse Info Banner */}
            {multiWarehouse && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Warehouse className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      Multi-Warehouse Fulfillment
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      This order will be fulfilled from {warehouseGroupArray.length} different
                      warehouses to ensure the best availability and delivery times.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warehouse Fulfillments */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                {multiWarehouse ? "Items by Warehouse" : "Order Items"}
              </h2>
              {warehouseGroupArray.map((group) => (
                <WarehouseFulfillment
                  key={group.location_id}
                  locationName={group.location_name}
                  items={group.items}
                  currencyCode="INR"
                />
              ))}
            </div>
          </div>

          {/* Sidebar - Order Summary & Address */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </h2>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-emerald-600">Free</span>
                </div>
                {multiWarehouse && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Warehouses</span>
                    <span>{warehouseGroupArray.length}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <h2 className="font-semibold">Customer Information</h2>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                  <p className="font-medium">{order.email}</p>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>Shipping Address</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      {order.shipping_address.first_name}{" "}
                      {order.shipping_address.last_name}
                    </p>
                    <p>{order.shipping_address.address_1}</p>
                    {order.shipping_address.address_2 && (
                      <p>{order.shipping_address.address_2}</p>
                    )}
                    <p>
                      {order.shipping_address.city},{" "}
                      {order.shipping_address.postal_code}
                    </p>
                    <p className="text-muted-foreground">
                      {order.shipping_address.country_code}
                    </p>
                    {order.shipping_address.phone && (
                      <p className="mt-2 text-muted-foreground">
                        Phone: {order.shipping_address.phone}
                      </p>
                    )}
                  </div>
                </div>

                {order.metadata?.payment_method && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground mb-1">Payment Method</p>
                      <p className="font-medium capitalize">
                        {order.metadata.payment_method.replace(/_/g, " ")}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
