"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Grid3X3,
  Truck,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const mainNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/", label: "All Products", icon: Package },
  { href: "/", label: "Categories", icon: Grid3X3 },
];

const categoryItems = [
  { href: "/", label: "Shirts" },
  { href: "/", label: "Sweatshirts" },
  { href: "/", label: "Pants" },
  { href: "/", label: "Merch" },
];

const bottomNavItems = [
  { href: "/", label: "Track Order", icon: Truck },
  { href: "/", label: "Help Center", icon: HelpCircle },
  { href: "/", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <ScrollArea className="h-full py-6">
      <div className="space-y-6 px-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <Separator />

        {/* Categories */}
        <div className="space-y-3">
          <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories
          </h4>
          <div className="space-y-1">
            {categoryItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <Separator />

        {/* Bottom Navigation */}
        <div className="space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
