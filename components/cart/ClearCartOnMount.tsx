"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";

export function ClearCartOnMount() {
  const { ready, items, clear } = useCart();
  useEffect(() => {
    if (ready && items.length) clear();
  }, [ready, items.length, clear]);
  return null;
}
