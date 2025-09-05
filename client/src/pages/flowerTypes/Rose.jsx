import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Rose() {
  return (
    <CategoryGridPage
      title="Roses"
      description="Timeless elegance—from classic reds to modern pastel palettes."
      heroImg="/assets/Types/Rose/hero.jpg"
      category="Rose"
      altFilters={[
        { key: "type", value: "Rose" },
        { key: "category", value: "Roses" }, // if admin used plural
      ]}
    />
  );
}
