// src/app/(dashboard)/homepage/restaurants/page.tsx
// Created: Featured restaurants management page

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FeaturedRestaurantsManager } from "@/components/homepage/featured-restaurants-manager";
import { getCurrentSession } from "@/actions/auth";
import { checkUserPermission } from "@/lib/supabase/permission-check";

export const metadata: Metadata = {
  title: "Featured Restaurants - Homepage",
};

export default async function FeaturedRestaurantsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const hasPermission = await checkUserPermission(
    session.userId,
    "featured_restaurants",
    "view"
  );

  if (!hasPermission) {
    redirect("/");
  }

  return <FeaturedRestaurantsManager />;
}
