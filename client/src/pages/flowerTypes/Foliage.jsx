import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Foliage() {
  return (
    <CategoryGridPage
      title="Foliage & Greens"
      description="Textural greenery to elevate bouquets and tablescapes."
      heroImg="/assets/Types/Foliage/hero.jpg"
      category="Foliage"
      altFilters={[
        { key: "type", value: "Foliage" },
        { key: "category", value: "Greens" },
        { key: "type", value: "Greens" },
      ]}
    />
  );
}
