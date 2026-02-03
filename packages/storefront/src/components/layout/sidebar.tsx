"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  Package,
  Truck,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CategoryNav } from "./category-nav";

const mainNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/", label: "All Products", icon: Package, clearCategory: true },
];

const bottomNavItems = [
  { href: "/", label: "Track Order", icon: Truck },
  { href: "/", label: "Help Center", icon: HelpCircle },
  { href: "/", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasCategory = searchParams.has("category");

  return (
    <ScrollArea className="h-full py-6">
      <div className="space-y-6 px-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            // "All Products" is active when on home page with no category filter
            const isActive =
              pathname === item.href &&
              (item.clearCategory ? !hasCategory : !item.clearCategory);

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
          <CategoryNav />
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
