"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Category, getCategories } from "@/lib/api";

export function CategoryNav() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const activeCategoryId = searchParams.get("category");

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 bg-muted/50 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const isActive = activeCategoryId === category.id;

        return (
          <Link
            key={category.id}
            href={`/?category=${category.id}`}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isActive ? "bg-foreground" : "bg-muted-foreground/50"
              }`}
            />
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}
