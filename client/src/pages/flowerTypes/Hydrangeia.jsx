import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Hydrangeia() {
  return (
    <CategoryGridPage
      title="Hydrangea Flowers"
      description="Cloud-like blooms in dreamy pastels—perfect for luxe arrangements."
      heroImg="/assets/Types/Hydrangea/hero.jpg"
      category="Hydrangeia"
      altFilters={[
        { key: "type", value: "Hydrangeia" },
        { key: "type", value: "Hydrangea" },
        { key: "category", value: "Hydrangea" },
      ]}
    />
  );
}
