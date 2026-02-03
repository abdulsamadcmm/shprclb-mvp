"use client";

import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WarehouseInfo } from "@/lib/api";

interface WarehouseSelectorProps {
  warehouses: WarehouseInfo[];
  selectedWarehouse: WarehouseInfo | null;
  onSelect: (warehouse: WarehouseInfo) => void;
}

function formatPrice(cents: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
  }).format(cents / 100);
}

export function WarehouseSelector({
  warehouses,
  selectedWarehouse,
  onSelect,
}: WarehouseSelectorProps) {
  if (warehouses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center">
        <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No warehouse pricing available for this variant
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Select Warehouse
      </label>
      <Select
        value={selectedWarehouse?.location_id || ""}
        onValueChange={(value) => {
          const warehouse = warehouses.find((w) => w.location_id === value);
          if (warehouse) {
            onSelect(warehouse);
          }
        }}
      >
        <SelectTrigger className="w-full h-12">
          <SelectValue placeholder="Choose a warehouse..." />
        </SelectTrigger>
        <SelectContent>
          {warehouses.map((warehouse) => (
            <SelectItem
              key={warehouse.location_id}
              value={warehouse.location_id}
              className="py-3"
            >
              <div className="flex items-center justify-between w-full gap-4">
                <span className="font-medium">{warehouse.location_name}</span>
                <span className="text-muted-foreground">
                  {formatPrice(warehouse.price, warehouse.currency_code)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
