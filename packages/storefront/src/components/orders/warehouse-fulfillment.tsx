import { MapPin } from "lucide-react";
import type { OrderLineItem } from "@/lib/api";

interface WarehouseFulfillmentProps {
  locationName: string;
  items: OrderLineItem[];
  currencyCode?: string;
}

function formatPrice(cents: number, currencyCode: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
  }).format(cents / 100);
}

export function WarehouseFulfillment({
  locationName,
  items,
  currencyCode = "INR",
}: WarehouseFulfillmentProps) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="bg-card rounded-lg border p-6 space-y-4">
      {/* Warehouse Header */}
      <div className="flex items-center gap-2 pb-3 border-b">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <div>
          <h3 className="font-semibold text-lg">{locationName}</h3>
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""} from this warehouse
          </p>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4">
            {/* Item Image */}
            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              {item.thumbnail || item.metadata?.thumbnail ? (
                <img
                  src={item.thumbnail || item.metadata?.thumbnail}
                  alt={item.metadata?.product_title || item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>

            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium leading-tight">
                {item.metadata?.product_title || item.title}
              </h4>
              {item.metadata?.variant_title && (
                <p className="text-sm text-muted-foreground mt-1">
                  {item.metadata.variant_title}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-muted-foreground">
                  Qty: <span className="font-medium text-foreground">{item.quantity}</span>
                </span>
                <span className="text-muted-foreground">
                  {formatPrice(item.unit_price, currencyCode)} each
                </span>
              </div>
            </div>

            {/* Item Total */}
            <div className="text-right">
              <p className="font-semibold">
                {formatPrice(item.total, currencyCode)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Warehouse Subtotal */}
      <div className="pt-3 border-t flex justify-between items-center">
        <span className="font-medium">Warehouse Subtotal</span>
        <span className="font-semibold text-lg">
          {formatPrice(subtotal, currencyCode)}
        </span>
      </div>
    </div>
  );
}
