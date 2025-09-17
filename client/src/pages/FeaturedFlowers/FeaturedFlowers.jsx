import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function FeaturedFlowers() {
  return (
    <CategoryGridPage
      title="Featured Flowers"
      description="Handpicked bestsellers, seasonal favorites, and new arrivals."
      heroImg="/images/backdrop.jpg"
      query={{ featured: true }}
    />
  );
}
