import React from "react";
import CategoryGridPage from "../../components/common/CategoryGridPage";

export default function Lilly() {
  return (
    <CategoryGridPage
      title="Lilies"
      description="Graceful stems with captivating fragrance and elegant form."
      heroImg="/assets/Types/Lily/hero.jpg"
      category="Lilly"
      altFilters={[
        { key: "type", value: "Lilly" },
        { key: "type", value: "Lily" }, // common spelling
        { key: "category", value: "Lily" },
      ]}
    />
  );
}
