import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function TeddyBear() {
  return (
    <CategoryGridPage
      title="Teddy Bear"
      description="Cuddly plush add-ons to pair perfectly with fresh flowers."
      heroImg="/assets/Collections/TeddyBear/hero.jpg"
      category="Teddy Bear"
      altFilters={[
        { key: "collection", value: "Teddy Bear" },
        { key: "collection", value: "Teddy" },
        { key: "category", value: "Teddy Bear" },
        { key: "tag", value: "Teddy Bear" },
        { key: "addon", value: "Teddy Bear" },
        { key: "addOn", value: "Teddy Bear" },
        { key: "type", value: "Teddy Bear" },
        { key: "category", value: "Plush" },
        { key: "tag", value: "Plush" },
      ]}
    />
  );
}
