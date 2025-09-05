import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Tulip() {
  return (
    <CategoryGridPage
      title="Tulips"
      description="Clean silhouettes and rich colors—effortlessly chic."
      heroImg="/assets/Types/Tulip/hero.jpg"
      category="Tulip"
      altFilters={[
        { key: "type", value: "Tulip" },
        { key: "category", value: "Tulips" }, // plural fallback
      ]}
    />
  );
}
