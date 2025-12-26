// src/app/(dashboard)/homepage/restaurants/page.tsx
// Created: Featured restaurants management page

import type { Metadata } from "next";
import { FeaturedRestaurantsManager } from "@/components/homepage/featured-restaurants-manager";

export const metadata: Metadata = {
  title: "Featured Restaurants - Homepage",
};

export default function FeaturedRestaurantsPage() {
  return <FeaturedRestaurantsManager />;
}
